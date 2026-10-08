import { config } from "dotenv";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "nara";

if (!uri) {
  console.error("Falta MONGODB_URI en .env.local");
  process.exit(1);
}

const OBS_TEMPLATES = {
  Financiador: ["avance", "recursos", "resultados"],
  Investigación: ["resultados", "datos"],
  "Institución de salud": ["casos"],
};

const users = [
  {
    id: "obs-salento",
    email: "observador@nara.com",
    password: "ObservadorNara2026",
    name: "Hospital local de Salento",
    org: "Hospital local de Salento",
    orgType: "Institución de salud",
    terr: "Salento",
  },
  {
    id: "obs-financiador",
    email: "financiador@nara.com",
    password: "FinanciadorNara2026",
    name: "Fundación NARA",
    org: "Fundación NARA",
    orgType: "Financiador",
    terr: "Todos",
  },
  {
    id: "obs-investigacion",
    email: "investigacion@nara.com",
    password: "InvestigacionNara2026",
    name: "Centro de Investigación NARA",
    org: "Centro de Investigación NARA",
    orgType: "Investigación",
    terr: "Todos",
  },
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection("accounts");
  const now = new Date();

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const modules = OBS_TEMPLATES[u.orgType];
    await col.updateOne(
      { id: u.id },
      {
        $set: {
          id: u.id,
          email: u.email,
          contact: u.email,
          name: u.name,
          org: u.org,
          orgType: u.orgType,
          modules,
          role: "Observador",
          roleId: "observador",
          terr: u.terr,
          status: "Activo",
          passwordHash,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now, created: true },
      },
      { upsert: true },
    );
    console.log("OK", u.email, "→", u.orgType);
  }

  await client.close();

  console.log("\n--- Credenciales ---\n");
  for (const u of users) {
    console.log(`## ${u.orgType}`);
    console.log(`Campo\tValor`);
    console.log(`Correo\t${u.email}`);
    console.log(`Contraseña\t${u.password}`);
    console.log(`Nombre\t${u.name}`);
    console.log(`Rol\tObservador`);
    console.log(`Tipo\t${u.orgType}`);
    console.log(`Organización\t${u.org}`);
    console.log("");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
