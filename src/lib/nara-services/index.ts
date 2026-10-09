export {
  NARA_SERVICES,
  NARA_SERVICE_BY_ID,
} from "./catalog.js";

export type NaraServiceId =
  | "mood"
  | "clin"
  | "ia"
  | "tech"
  | "revisit"
  | "cursos";

export type NaraServiceDef = {
  id: NaraServiceId | string;
  name: string;
  navLabel: string;
  note: string;
  freqs: string[];
  hasLibraryBtn?: boolean;
};
