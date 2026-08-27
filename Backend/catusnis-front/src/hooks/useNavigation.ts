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

// ✅ NOUVEAU (27/08/2026) — même email que backend OwnerAccess.OWNER_EMAIL.
// Le sous-menu "Verrouillage système" (key 'system-lock') ne doit apparaître
// QUE pour cette adresse exacte, même pour d'autres comptes SUPER_ADMIN —
// restriction demandée par Fanck, plus stricte qu'un simple rôle.
// ⚠️ Si l'email change côté backend (OwnerAccess.java), le changer ici aussi.
const OWNER_EMAIL = 'amoikonlouisfranck@gmail.com';

export function useNavigation(): NavState {
  const { person } = useAuth();

  const [menus,       setMenus]       = useState<NavMenu[]>([]);
  const [alerteCount, setAlerteCount] = useState(0);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!person) return;
    const currentRole = person.role || 'USER';

    let built = buildMenusForRole(currentRole);

    // ✅ NOUVEAU — filtre le sous-menu 'system-lock' pour tout le monde
    // sauf le propriétaire exact, indépendamment du rôle déjà appliqué
    // par buildMenusForRole (qui laisse passer 'system-lock' pour tout
    // SUPER_ADMIN via '*').
    const isOwner = (person.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase();
    if (!isOwner) {
      built = built
        .map(menu => ({
          ...menu,
          children: menu.children.filter(c => c.key !== 'system-lock'),
        }))
        .filter(menu => menu.children.length > 0);
    }

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