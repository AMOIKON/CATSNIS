// ── Auth ──────────────────────────────────────────────────────────────────────
export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'TECHNICIEN' | 'LOGISTICIEN' | 'USER';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName:  string;
  lastName:   string;
  email:      string;
  contact:    string;
  password:   string;
  postId:     number;
  unitsId:    number;
  partnerId?: number;
  role?:          AppRole;
  plainPassword?: string;
}

export interface PersonInfo {
  id:           number;
  firstName:    string;
  lastName:     string;
  email:        string;
  contact:      string;
  role:         AppRole;
  postName:     string;
  unitsName:    string;
  partnerName?: string;
  partnerId?:   number;
}

export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  tokenType:    string;
  expiresIn:    number;
  person:       PersonInfo;
}

export interface UpdatePersonRequest {
  firstName:  string;
  lastName:   string;
  email:      string;
  contact:    string;
  postId:     number;
  unitsId:    number;
  partnerId?: number;
  role?:          AppRole;
  plainPassword?: string;
}

// ── ApiResponse ───────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data:    T;
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface Page<T> {
  content: T[];
  page: {
    size:          number;
    number:        number;
    totalElements: number;
    totalPages:    number;
  };
}

// ── Acquisitions ──────────────────────────────────────────────────────────────
export interface AcquisitionResponse {
  id:          number;
  image:       string;
  tag:         string;
  dateAcq:     string;
  quantity:    number;
  serial:      string;
  Type:        string;
  typesId:     number;
  status:      string;
  deployed:    boolean;
  partnerName?: string;
  partnerId?:   number;
}

export interface AcquisitionRequest {
  image:      string;
  tag:        string;
  dateAcq:    string;
  quantity:   number;
  serial:     string;
  typesId:    number;
  partnerId?: number;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface TypeResponse {
  id:       number;
  typeName: string;
  image:    string;
  marque:   string;
  modele:   string;
  base64?:  string | null;
}

export interface TypesRequest {
  typeName: string;
  image:    string;
  marque:   string;
  modele:   string;
}

// ── Région ────────────────────────────────────────────────────────────────────
export interface RegionResponse {
  id:           number;
  regionName:   string;
  districtName: string;
}

export interface RegionRequest {
  regionName: string;
}

// ── District ──────────────────────────────────────────────────────────────────
export interface DistrictResponse {
  id:             number;
  DistrictName:   string;
  regionDistrict: string;
}

export interface DistrictRequest {
  districtName: string;
  regionId:     number;
}

// ── Site de santé ─────────────────────────────────────────────────────────────
export interface HealthResponse {
  id:           number;
  healthName:   string;
  districtName: string;
  Region:       string;
}

export interface HealthRequest {
  healthName: string;
  districtId: number;
  regionId:   number;
}

// ── Partenaires ───────────────────────────────────────────────────────────────
export interface PartnerResponse {
  id:          number;
  partnerName: string;
  logo:        string;
  color:       string;
  image:       string;
  base64?:     string | null;
}

export interface PartnerRequest {
  partnerName: string;
  logo:        string;
  color:       string;
  image:       string;
}

// ── Units ─────────────────────────────────────────────────────────────────────
export interface UnitsResponse {
  id:       number;
  unitName: string;
}

export interface UnitsRequest {
  unitName: string;
}

// ── Apps ──────────────────────────────────────────────────────────────────────
export interface AppsResponse {
  id:       number;
  appsName: string;
  icon:     string;
  color:    string;
  image:    string;
  base64?:  string | null;
}

export interface AppsRequest {
  appName: string;
  icon:    string;
  color:   string;
  image:   string;
}

// ── States ────────────────────────────────────────────────────────────────────
export interface StatesResponse {
  id:         number;
  statesName: string;
}

export interface StatesRequest {
  statesName: string;
}

// ── Post ──────────────────────────────────────────────────────────────────────
export interface PostResponse {
  id:       number;
  postName: string;
}

export interface PostRequest {
  postName: string;
}

// ── Images ────────────────────────────────────────────────────────────────────
export interface ImageResponse {
  id:       number;
  fileName: string;
  label:    string;
  url:      string;
  base64?:  string | null;
}

export interface ImageRequest {
  fileName: string;
  label:    string;
}

// ── Deployment Items ──────────────────────────────────────────────────────────
export interface DeploymentItemRequest {
  acquisitionId: number;
  status:        'FONCTIONNEL' | 'NON_FONCTIONNEL';
}

export interface DeploymentItemResponse {
  id:            number;
  acquisitionId: number;
  tag:           string;
  serial:        string;
  typeName:      string;
  status:        string;
  etatAvant?:    string;
  etatApres?:    string;
  replacementId?:     number;
  replacementTag?:    string;
  replacementSerial?: string;
  replacementType?:   string;
  deploymentCode?:    string;
  healthName?:        string;
}

// ── Déploiements ──────────────────────────────────────────────────────────────
export interface DeploymentRequest {
    codeDep: string;
    dateRecep: string;
    comment?: string;
    regionId: number;
    districtId: number;
    // ✅ MODIFIÉ — optionnel : facultatif si receivedByPost = "Convoyeur"
    healthId?: number;
    appsId: number;
    items: DeploymentItemRequest[];
    partnerId?: number;

    // ── Géolocalisation ──────────────────────────────────
    latitude?: number;
    longitude?: number;

    // ── Personne réceptionnaire ──────────────────────────
    receivedByBookletId?: number;
    receivedByName?: string;
    receivedByContact?: string;
    receivedByPost?: string;
}

export interface DeploymentResponse {
  id:             number;
  codeDep:        string;
  dateRecep:      string;
  comment:        string;
  regionDeploy:   string;
  districtDeploy: string;
  healthDeploy:   string;
  appsDeploy:     string;
  appsIcon:       string;
  appsColor:      string;
  appsImage:      string;
  technicianName: string;
  partnerName:    string;
  partnerLogo:    string;
  partnerColor:   string;
  partnerImage:   string;
  partnerId?:     number;
  appsId:         number;
  regionId:       number;
  districtId:     number;
  healthId:       number;
  items:          DeploymentItemResponse[];
  // ── Géolocalisation ──────────────────────────────────────────────────────
  latitude?:  number;
  longitude?: number;
  // ── Personne réceptionnaire ──────────────────────────
    receivedByBookletId?: number;
    receivedByName?: string;
    receivedByContact?: string;
    receivedByPost?: string;
}

// ── Interventions ─────────────────────────────────────────────────────────────
export interface InterventionResponse {
  id:                   number;
  codeInter:            string;
  typeInter:            string;
  actionInter:          string;
  commentInter:         string;
  dateInter:            string;
  durationMinutes:      number;
  regionName:           string;
  districtName:         string;
  healthName:           string;
  typeName:             string;
  deploymentCode:       string;
  appName:              string;
  appsIcon:             string;
  appsColor:            string;
  appsImage:            string;
  partnerName:          string;
  partnerLogo:          string;
  partnerColor:         string;
  partnerImage:         string;
  technicianName:       string;
  personName:           string;
  evlName:              string;
  documentPath:         string;
  // ✅ nullable en mode "structure hors base" (region/district/site non renseignés)
  regionId?:            number;
  districtId?:          number;
  healthId?:            number;
  deploymentId:         number;
  evaluationId:         number;
  personId?:            number;
  typesId:              number;
  appsId:               number;
  deploymentItems:      DeploymentItemResponse[];
  enAttenteMaintenance?: boolean;
  personContact?: string;
  personPost?:    string;
  // ✅ Email de la personne assistée (booklet.email, ou saisie manuelle)
  personEmail?:   string;
  partnerId?:     number;
  // ── Géolocalisation ──────────────────────────────────────────────────────
  latitude?:  number;
  longitude?: number;

  // ── Équipement hors base ──────────────────────────────────────────────────
  manualEquipmentName?: string;
  manualEquipmentType?: string;

  // ── Structure hors base ───────────────────────────────────────────────────
  manualStructureName?: string;
 // ── Structure etatique ───────────────────────────────────────────────────
structureEtatiqueId?: number;
structureEtatiqueName?: string;

}

export interface InterventionRequest {
  typeInter:                string;
  actionInter:              string;
  commentInter:             string;
  dateInter:                string;
  durationMinutes:          number;
  regionId:                 number;
  districtId:               number;
  healthId:                 number;
  typesId:                  number;
  appsId:                   number;
  deploymentId:             number;
  evaluationId?:             number;
  personId?:                number;
  bookletId?:               number;
  etatsAvant?:              Record<number, string>;
  etatsApres?:              Record<number, string>;
  replacements?:            Record<number, number>;
  replacementAcquisitionId?: number;
  enAttenteMaintenance?:    boolean;
  selectedItemIds?:         number[];
  maintenanceReussie?:      Record<number, boolean>;
  manualPersonName?:        string;
  manualPersonContact?:     string;
  manualPersonPost?:        string;
  // Email pour l'envoi du rapport d'intervention (personne saisie manuellement)
  manualPersonEmail?:       string;
  partnerId?:               number;
  // ── Géolocalisation ──────────────────────────────────────────────────────
  latitude?:  number;
  longitude?: number;

  // ── Équipement hors base ──────────────────────────────────────────────────
  manualEquipmentName?: string;
  manualEquipmentType?: string;

  // ── Structure hors base (région/district/site non renseignés) ────────────
  manualStructureName?: string;
 // ── Structure etatique ───────────────────────────────────────────────────
structureEtatiqueId?: number;
structureEtatiqueNom?: string;

}

// ── Appreciation ──────────────────────────────────────────────────────────────
export interface AppreciationResponse {
  id:             number;
  appreciateName: string;
}

// ── Evaluation ────────────────────────────────────────────────────────────────
export interface EvaluationResponse {
  id:      number;
  evlName: string;
}

// ── TechnicianSite ────────────────────────────────────────────────────────────
export interface TechnicianSiteResponse {
  id:              number;
  personId:        number;
  technicianName:  string;
  technicianEmail: string;
  regionId:        number;
  regionName:      string;
  districtId:      number;
  districtName:    string;
  healthId:        number;
  healthName:      string;
}

export interface TechnicianSiteRequest {
  personId:    number;
  regionId?:   number;
  districtId?: number;
  healthId?:   number;
}

// ── Entités de référence ──────────────────────────────────────────────────────
export interface Region {
  id:         number;
  regionName: string;
}

export interface District {
  id:           number;
  districtName: string;
}

export interface Post {
  id:       number;
  postName: string;
}

export interface BookletStatus {
  id:         number;
  statusName: string;
}

// ── Booklet ───────────────────────────────────────────────────────────────────
export interface Booklet {
  id:        number;
  firstName: string;
  lastName:  string;
  contact:   string;
  email:     string;
  region:    Region;
  district:  District;
  post:      Post;
  status:    BookletStatus;
  createdAt: string;
}

export interface BookletRequest {
  firstName: string;
  lastName:  string;
  contact:   string;
  email:     string;
  region:    { id: number };
  district:  { id: number };
  post:      { id: number };
  status:    { id: number };
}

export interface BookletStats {
  [statusName: string]: number;
}

export type ItemStatus =
    | 'FONCTIONNEL'
    | 'DEGRADE'
    | 'EN_ATTENTE_INTERVENTION_SITE'
    | 'NON_FONCTIONNEL'
    | 'REMPLACE';

export type ActionInter =
    | 'MAINTENANCE'
    | 'MAINTENANCE_CURATIVE'
    | 'MAINTENANCE_PREVENTIVE'
    | 'REMPLACEMENT';