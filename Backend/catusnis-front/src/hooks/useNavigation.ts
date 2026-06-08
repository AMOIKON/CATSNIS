import { useState, useEffect } from 'react';
import { buildMenusForRole, NavMenu } from '../config/NavigationConfig';
import useAuth from './useAuth';
import VehiculeService from '../services/vehiculeService';

interface AlerteItem {
  niveau: string;
}

interface NavState {
  menus:       NavMenu[];
  alerteCount: number;
  loading:     boolean;
}

export function useNavigation(): NavState {
  const { person } = useAuth();

  const [menus,       setMenus]       = useState<NavMenu[]>([]);
  const [alerteCount, setAlerteCount] = useState(0);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!person) return;
    const currentRole = person.role || 'USER';

    const built = buildMenusForRole(currentRole);
    setMenus(built);
    setLoading(false);

    const canSeeAlerts = ['SUPER_ADMIN','ADMIN','TECHNICIEN','LOGISTICIEN'].includes(currentRole);
    if (canSeeAlerts) {
      VehiculeService.getAlertes(30)
        .then((alertes: AlerteItem[]) => {
          const expiredCount = alertes.filter((a: AlerteItem) => a.niveau === 'EXPIRE').length;
          setAlerteCount(expiredCount);

          setMenus(prev =>
            prev.map(menu => ({
              ...menu,
              children: menu.children.map(child =>
                child.key === 'docs-parc'
                  ? { ...child, badge: expiredCount > 0 ? expiredCount : undefined }
                  : child
              ),
            }))
          );
        })
        .catch(() => {});
    }
  }, [person]);

  return { menus, alerteCount, loading };
}