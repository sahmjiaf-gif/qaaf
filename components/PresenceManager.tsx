import React, { useEffect } from 'react';
import { useApp } from '../state';
import { db, rdb } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref as rdbRef, set as rdbSet, onDisconnect as rdbOnDisconnect } from 'firebase/database';

export const GlobalPresenceManager: React.FC = () => {
  const { currentStaff } = useApp();

  useEffect(() => {
    if (!currentStaff || !currentStaff.id) return;
    if (!db || !rdb) return;

    const staffRef = doc(db, 'staff', currentStaff.id);
    const presenceRef = rdbRef(rdb, `presence/${currentStaff.id}`);

    const getTodayKey = () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const isAdminRoute = () => {
      return window.location.hash.startsWith('#/admin');
    };

    let lastMarkedOnline = false;

    // ─── INSTANT mark online/offline ─────────────────────────────────
    const markOnline = () => {
      lastMarkedOnline = true;
      const now = new Date().toISOString();
      // RTDB presence update (fast, reliable with onDisconnect)
      try {
        if (rdb && presenceRef) {
          rdbSet(presenceRef, { isOnline: true, lastActive: now, userAgent: navigator.userAgent });
          // ensure onDisconnect flips the flag
          rdbOnDisconnect(presenceRef).set({ isOnline: false, lastActive: now }).catch(() => {});
        }
      } catch (e) {
        // fallback to Firestore if RTDB fails
      }
      if (staffRef) {
        updateDoc(staffRef, {
          isOnline: true,
          lastActive: now
        }).catch(console.error);
      }
    };

    const markOffline = () => {
      if (!lastMarkedOnline) return; // Avoid redundant offline pings to save Firestore quota
      lastMarkedOnline = false;
      const now = new Date().toISOString();
      try {
        if (rdb && presenceRef) {
          rdbSet(presenceRef, { isOnline: false, lastActive: now, userAgent: navigator.userAgent });
        }
      } catch (e) {}
      if (staffRef) {
        updateDoc(staffRef, {
          isOnline: false,
          lastActive: now
        }).catch(console.error);
      }
    };

    // ─── Full attendance calculation (async, runs in background) ─────
    const syncAttendance = async (isActive: boolean) => {
      try {
        const now = Date.now();
        const todayKey = getTodayKey();

        const staffSnap = await getDoc(staffRef);
        if (!staffSnap.exists()) return;

        const staffData = staffSnap.data();
        const shiftHours = staffData.shiftHours || 8;
        const attendance = staffData.attendance || {};

        let todayAttendance = attendance[todayKey];
        if (!todayAttendance) {
          todayAttendance = {
            startTime: new Date(now).toISOString(),
            lastPing: new Date(now).toISOString(),
            totalAwaySeconds: 0,
            totalActiveSeconds: 0,
            shiftHours
          };
        }

        const startTimeMs = new Date(todayAttendance.startTime).getTime();
        const shiftEndMs = startTimeMs + shiftHours * 3600000;
        const lastPingMs = new Date(todayAttendance.lastPing).getTime();

        let addedActive = 0;
        let addedAway = 0;

        if (lastPingMs < shiftEndMs) {
          const elapsed = Math.round((Math.min(now, shiftEndMs) - lastPingMs) / 1000);
          if (elapsed > 0) {
            const gap = now - lastPingMs;
            if (!isActive || gap > 3500) {
              addedAway = elapsed;
            } else {
              addedActive = elapsed;
            }
          }
        }

        await updateDoc(staffRef, {
          attendance: {
            ...attendance,
            [todayKey]: {
              ...todayAttendance,
              totalActiveSeconds: (todayAttendance.totalActiveSeconds || 0) + addedActive,
              totalAwaySeconds: (todayAttendance.totalAwaySeconds || 0) + addedAway,
              lastPing: new Date(now).toISOString(),
              shiftHours
            }
          }
        });
      } catch (e) {
        console.error('Attendance sync failed:', e);
      }
    };

    // ─── Initial online mark ──────────────────────────────────────────
    if (isAdminRoute()) {
      markOnline();
      syncAttendance(true);
    } else {
      markOffline();
    }

    // ─── Heartbeat every 1 second (INSTANT active ping + attendance) ────────
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && isAdminRoute()) {
        markOnline();
        syncAttendance(true);
      } else if (!isAdminRoute()) {
        markOffline();
      }
    }, 1000);

    // ─── Instant offline on tab hide / split screen / route change ───
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible' || !isAdminRoute()) {
        markOffline();           // instant write
        syncAttendance(false);   // background attendance update
      } else {
        markOnline();            // instant write
        syncAttendance(true);    // background attendance update
      }
    };

    const handleHashChange = () => {
      if (isAdminRoute()) {
        markOnline();
        syncAttendance(true);
      } else {
        markOffline();
        syncAttendance(false);
      }
    };

    // ─── Mark offline on close/navigate ──────────────────────────────
    const handleUnload = () => {
      // Best effort - synchronous not guaranteed on tab close
      navigator.sendBeacon && navigator.sendBeacon('', '');
      markOffline();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      markOffline();
    };
  }, [currentStaff?.id]);

  return null;
};
