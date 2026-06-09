import subprocess
import mysql.connector

DB_CONFIG = {
    "host":     "127.0.0.1",
    "port":     3307,
    "user":     "catusnis_user",
    "password": "catusnis_password",
    "database": "catusnis_db"
}

CONTAINER  = "catusnis-app"
UPLOAD_DIR = "/app/uploads/images"

def get_files():
    result = subprocess.run(["docker", "exec", CONTAINER, "ls", UPLOAD_DIR], capture_output=True, text=True)
    return [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]

def read_file(filename):
    result = subprocess.run(["docker", "exec", CONTAINER, "cat", f"{UPLOAD_DIR}/{filename}"], capture_output=True)
    return result.stdout

def get_mime(filename):
    ext = filename.lower().split(".")[-1]
    return {"png":"image/png","jpg":"image/jpeg","jpeg":"image/jpeg"}.get(ext,"application/octet-stream")

def migrate():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    files = get_files()
    print(f"📁 {len(files)} fichier(s) trouvé(s)")
    for filename in files:
        data = read_file(filename)
        if not data:
            print(f"⚠️  Vide : {filename}")
            continue
        mime = get_mime(filename)
        cursor.execute("SELECT id, data FROM images WHERE file_name = %s", (filename,))
        row = cursor.fetchone()
        if row:
            img_id, existing_data = row
            if existing_data:
                print(f"✅ Déjà migré : {filename}")
                continue
            cursor.execute("UPDATE images SET data = %s, mime_type = %s, file_size = %s WHERE id = %s", (data, mime, len(data), img_id))
            print(f"🔄 Mis à jour : {filename} ({len(data)} bytes)")
        else:
            cursor.execute("INSERT INTO images (file_name, label, mime_type, file_size, data) VALUES (%s, %s, %s, %s, %s)", (filename, filename, mime, len(data), data))
            print(f"➕ Inséré : {filename} ({len(data)} bytes)")
        conn.commit()
    cursor.close()
    conn.close()
    print("✅ Migration terminée !")

migrate()
