import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider }        from "./context/AuthContext";
import ProtectedRoute          from "./components/common/ProtectedRoute";
import LoginPage               from "./pages/auth/LoginPage";

// ── Dashboards ────────────────────────────────────────────────────────────────
import DashboardGeneral        from "./pages/dashboard/Dashboardgeneral";
import DashboardEquipement     from "./pages/dashboard/Dashboardequipement";
import DashboardLogisticien    from "./pages/dashboard/DashboardLogisticien";
import DashboardTechnicien     from "./pages/dashboard/DashboardTechnicien";
import DashboardUser           from "./pages/dashboard/DashboardUser";

// ── Personnes / Accès ─────────────────────────────────────────────────────────
import PersonsPage             from "./pages/persons/PersonsPage";

// ── Organisation ──────────────────────────────────────────────────────────────
import RegionsPage             from "./pages/regions/RegionsPage";
import DistrictsPage           from "./pages/districts/DistrictsPage";
import HealthPage              from "./pages/health/HealthPage";
import PartnersPage            from "./pages/partners/PartnersPage";
import BookletPage             from "./pages/booklet/BookletPage";
import TechnicianSitePage      from "./pages/technicien-sites/TechnicianSitePage";

// ── Équipements ───────────────────────────────────────────────────────────────
import TypesPage               from "./pages/types/TypesPage";
import AcquisitionsPage        from "./pages/acquisitions/AcquisitionsPage";
import DeploymentsPage         from "./pages/Deployment/DeploymentsPage";
import InterventionsPage       from "./pages/interventions/InterventionsPage";
import InterventionDetailPage  from "./pages/interventions/InterventionDetailPage";
import ArchivesPage            from "./pages/Archives/Archivespages";

// ── Parc véhicules ────────────────────────────────────────────────────────────
import VehiculesPage           from "./pages/vehicules/VehiculesPage";
import FournituresPage         from "./pages/fourniture/Fourniturespage";

// ── Paramètres ────────────────────────────────────────────────────────────────
import UnitsPage               from "./pages/units/UnitsPage";
import AppsPage                from "./pages/apps/AppsPage";
import StatesPage              from "./pages/states/StatesPage";
import PostsPage               from "./pages/posts/PostsPage";
import ImagesPage              from "./pages/images/ImagesPage";
import PermissionsConfigPage   from "./pages/permissions/PermissionsConfigPage";
import PrintConfigPage         from "./pages/print-config/PrintConfigPage";
import EvaluationsPage         from "./pages/Evaluation/Evaluationpage";
import SignatureSettingsPage   from "./pages/signature/SignatureSettingsPage";

// ✅ Documentation / Manuels ───────────────────────────────────────────────────
import ManualPage              from "./pages/manuals/ManualPage";

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <Routes>
        {/* ── Public ── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ── Dashboards ── */}
        <Route path="/dashboard"             element={<Navigate to="/dashboard-general" replace />} />
        <Route path="/dashboard-general"     element={<P><DashboardGeneral /></P>} />
        <Route path="/dashboard-equipement"  element={<P><DashboardEquipement /></P>} />
        <Route path="/dashboard-logistique"  element={<P><DashboardLogisticien /></P>} />
        <Route path="/dashboard-technicien"  element={<P><DashboardTechnicien /></P>} />
        <Route path="/dashboard-user"        element={<P><DashboardUser /></P>} />

        {/* ── Personnes ── */}
        <Route path="/persons" element={<P><PersonsPage /></P>} />

        {/* ── Organisation ── */}
        <Route path="/regions"          element={<P><RegionsPage /></P>} />
        <Route path="/districts"        element={<P><DistrictsPage /></P>} />
        <Route path="/health-sites"     element={<P><HealthPage /></P>} />
        <Route path="/partners"         element={<P><PartnersPage /></P>} />
        <Route path="/booklets"         element={<P><BookletPage /></P>} />
        <Route path="/technician-sites" element={<P><TechnicianSitePage /></P>} />

        {/* ── Équipements ── */}
        <Route path="/types"         element={<P><TypesPage /></P>} />
        <Route path="/acquisitions"  element={<P><AcquisitionsPage /></P>} />
        <Route path="/deployments"   element={<P><DeploymentsPage /></P>} />
        <Route path="/interventions" element={<P><InterventionsPage /></P>} />
        <Route path="/interventions/:id" element={<P><InterventionDetailPage /></P>} />
        <Route path="/archives"      element={<P><ArchivesPage /></P>} />

        {/* ── Parc ── */}
        <Route path="/vehicules"   element={<P><VehiculesPage /></P>} />
        <Route path="/fournitures" element={<P><FournituresPage /></P>} />

        {/* ── Paramètres ── */}
        <Route path="/settings/units"        element={<P><UnitsPage /></P>} />
        <Route path="/settings/apps"         element={<P><AppsPage /></P>} />
        <Route path="/settings/states"       element={<P><StatesPage /></P>} />
        <Route path="/settings/posts"        element={<P><PostsPage /></P>} />
        <Route path="/settings/images"       element={<P><ImagesPage /></P>} />
        <Route path="/settings/permissions"  element={<P><PermissionsConfigPage /></P>} />
        <Route path="/settings/print-config" element={<P><PrintConfigPage /></P>} />
        <Route path="/settings/evaluations"  element={<P><EvaluationsPage /></P>} />
        <Route path="/settings/signature"    element={<P><SignatureSettingsPage /></P>} />

        {/* ✅ Documentation ── */}
        <Route path="/manuals" element={<P><ManualPage /></P>} />

        {/* ── Redirections ── */}
        <Route path="/"  element={<Navigate to="/login" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;