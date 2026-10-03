/**
 * =============================================================================
 * TRJT 3A — GOOGLE APPS SCRIPT BACKEND GALERI GOOGLE DRIVE
 * =============================================================================
 * Folder ID: 1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-
 * Web App URL: https://script.google.com/macros/s/AKfycbyHFr2mR2wrQZJoRhr5DhBBkJ04fNiQ5OpEj9Tc1WnWZrDyv_c1bEWNmEWwzDIEJwWfMA/exec
 * =============================================================================
 */

const FOLDER_ID = "1612E_PgMWjnuAJ9WXDZHdPj5bbP32Ps-";

/**
 * PENTING: Jalankan fungsi ini di editor (klik tombol Run / Jalankan)
 * untuk membuka izin otorisasi Akun Google Anda ke Google Drive.
 */
function testUpload() {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    Logger.log("1. Folder ditemukan: " + folder.getName());
    const testFile = folder.createFile("test_koneksi.txt", "Koneksi upload dan izin DriveApp berhasil!");
    Logger.log("2. File berhasil dibuat: " + testFile.getId());
    testFile.setTrashed(true);
    Logger.log("3. File berhasil dihapus. Semua izin Tulis & Hapus aktif 100%!");
  } catch (err) {
    Logger.log("Gagal: " + err.message);
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// 1. GET Request: Ambil daftar foto, hapus foto, atau ubah nama foto via GET
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = (params.action || '').toLowerCase();

    // FITUR HAPUS FOTO VIA GET
    if (action === 'delete' || action === 'hapus' || params.delete) {
      const fileId = params.id || params.fileId;
      if (!fileId) throw new Error("ID foto tidak ditemukan.");
      
      try {
        const file = DriveApp.getFileById(fileId);
        file.setTrashed(true);
      } catch (errDrive) {
        return jsonResponse({
          success: true,
          id: fileId,
          message: "Foto sudah dihapus atau tidak ditemukan di Google Drive."
        });
      }

      return jsonResponse({
        success: true,
        id: fileId,
        message: "Foto berhasil dipindahkan ke tempat sampah Google Drive."
      });
    }

    // FITUR UBAH NAMA FOTO VIA GET
    if (action === 'rename' || action === 'update') {
      const fileId = params.id || params.fileId;
      const newCaption = (params.name || params.caption || '').trim();
      if (!fileId) throw new Error("ID foto tidak ditemukan.");
      if (!newCaption) throw new Error("Nama keterangan baru tidak boleh kosong.");

      const file = DriveApp.getFileById(fileId);
      const sanitized = newCaption.replace(/[\\/:*?"<>|]/g, '').trim();
      const currentName = file.getName();
      const ext = currentName.includes('.') ? currentName.split('.').pop() : 'jpg';
      const targetFileName = sanitized + '.' + ext;

      file.setName(targetFileName);
      file.setDescription(newCaption);

      return jsonResponse({
        success: true,
        id: fileId,
        name: targetFileName,
        caption: newCaption,
        message: "Nama file berhasil diubah di Google Drive."
      });
    }

    // Default: Ambil daftar foto dari folder
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.getFiles();
    const images = [];

    while (files.hasNext()) {
      const file = files.next();
      
      // Lewati file yang sudah di sampah
      if (file.isTrashed && file.isTrashed()) {
        continue;
      }

      const mimeType = file.getMimeType();
      if (mimeType.startsWith("image/")) {
        const fileDesc = (file.getDescription() || "").trim();
        let fileName = file.getName();

        // SINKRONKAN NAMA KE GOOGLE DRIVE:
        // Jika file memiliki deskripsi/keterangan, pastikan nama file di Google Drive juga diubah sesuai keterangan
        if (fileDesc) {
          const sanitized = fileDesc.replace(/[\\/:*?"<>|]/g, '').trim();
          if (sanitized) {
            const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
            const expectedName = sanitized + '.' + ext;
            if (fileName !== expectedName) {
              try {
                file.setName(expectedName);
                fileName = expectedName;
              } catch (errRename) {}
            }
          }
        }

        const cleanName = fileName.replace(/\.[^/.]+$/, "");
        const displayCaption = fileDesc || cleanName;

        images.push({
          id: file.getId(),
          name: fileName,
          mimeType: mimeType,
          caption: displayCaption,
          url: "https://drive.google.com/uc?export=view&id=" + file.getId(),
          thumbnail: "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w360",
          fullRes: "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1200",
          original: "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w3000",
          created: file.getDateCreated().toISOString(),
          updated: file.getLastUpdated().toISOString()
        });
      }
    }

    // Urutkan dari yang paling baru
    images.sort((a, b) => new Date(b.created) - new Date(a.created));

    return jsonResponse({
      success: true,
      total: images.length,
      images: images
    });

  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message
    });
  }
}

// 2. POST Request: Upload atau Hapus Foto
function doPost(e) {
  try {
    let data = {};

    // Parsing payload POST baik format JSON maupun Form-data
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        if (e.parameter) {
          data = e.parameter;
        } else {
          throw new Error("Format payload JSON tidak valid.");
        }
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    } else {
      throw new Error("Payload data tidak ditemukan.");
    }

    // Gabungkan query parameters jika ada
    if (e && e.parameter) {
      data = Object.assign({}, e.parameter, data);
    }

    // A. FITUR HAPUS FOTO
    const action = (data.action || '').toLowerCase();
    if (action === 'delete' || action === 'hapus' || data.delete) {
      const fileId = data.id || data.fileId;
      if (!fileId) throw new Error("ID foto tidak ditemukan.");
      
      try {
        const file = DriveApp.getFileById(fileId);
        file.setTrashed(true);
      } catch (errDrive) {
        return jsonResponse({
          success: true,
          id: fileId,
          message: "Foto sudah dihapus atau tidak ditemukan di Google Drive."
        });
      }

      return jsonResponse({
        success: true,
        id: fileId,
        message: "Foto berhasil dipindahkan ke tempat sampah Google Drive."
      });
    }

    // B. FITUR UBAH NAMA FOTO
    if (action === 'rename' || action === 'update') {
      const fileId = data.id || data.fileId;
      const newCaption = (data.name || data.caption || '').trim();
      if (!fileId) throw new Error("ID foto tidak ditemukan.");
      if (!newCaption) throw new Error("Nama keterangan baru tidak boleh kosong.");

      const file = DriveApp.getFileById(fileId);
      const sanitized = newCaption.replace(/[\\/:*?"<>|]/g, '').trim();
      const currentName = file.getName();
      const ext = currentName.includes('.') ? currentName.split('.').pop() : 'jpg';
      const targetFileName = sanitized + '.' + ext;

      file.setName(targetFileName);
      file.setDescription(newCaption);

      return jsonResponse({
        success: true,
        id: fileId,
        name: targetFileName,
        caption: newCaption,
        message: "Nama file berhasil diubah di Google Drive."
      });
    }

    // C. FITUR UPLOAD FOTO
    if (!data.base64) {
      throw new Error("Data gambar base64 tidak ditemukan.");
    }

    const folder = DriveApp.getFolderById(FOLDER_ID);
    const decoded = Utilities.base64Decode(data.base64);

    const now = new Date();
    const pad = (n) => (n < 10 ? '0' : '') + n;
    const timeStamp = '' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '_' +
                      pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    const randSuffix = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();

    // Penamaan file: Mengikuti Keterangan foto (Caption) jika diisi
    const captionText = (data.caption || data.name || data.fileName || data.filename || '').trim();
    let finalFileName = '';

    if (captionText) {
      // Bersihkan karakter ilegal untuk nama file (\ / : * ? " < > |)
      const sanitized = captionText.replace(/[\\/:*?"<>|]/g, '').trim();
      finalFileName = (sanitized || ('TRJT3A_' + timeStamp)) + '.jpg';
    } else {
      finalFileName = 'TRJT3A_' + timeStamp + '_' + randSuffix + '.jpg';
    }

    const mime = data.mimeType || 'image/jpeg';
    const blob = Utilities.newBlob(decoded, mime, finalFileName);
    const file = folder.createFile(blob);
    file.setName(finalFileName);

    if (captionText) {
      try {
        file.setDescription(captionText);
      } catch (errDesc) {}
    }

    return jsonResponse({
      success: true,
      id: file.getId(),
      name: file.getName(),
      mimeType: mime,
      caption: captionText || file.getName().replace(/\.[^/.]+$/, ''),
      url: "https://drive.google.com/uc?export=view&id=" + file.getId(),
      thumbnail: "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000",
      created: file.getDateCreated().toISOString(),
      message: "Foto berhasil diupload ke Google Drive dengan nama: " + finalFileName
    });

  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * =============================================================================
 * FUNGSI BANTUAN SINKRONISASI NAMA FOTO GOOGLE DRIVE
 * =============================================================================
 * Jalankan fungsi ini di script.google.com (pilih fungsi 'sinkronkanSemuaNamaFoto'
 * lalu klik 'Run / Jalankan') untuk mengubah nama SEMUA foto yang sudah ada
 * di Google Drive agar langsung berganti nama sesuai keterangan/caption-nya!
 */
function sinkronkanSemuaNamaFoto() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFiles();
  let count = 0;
  
  while (files.hasNext()) {
    const file = files.next();
    if (file.isTrashed && file.isTrashed()) continue;
    
    const desc = (file.getDescription() || '').trim();
    if (desc) {
      const sanitized = desc.replace(/[\\/:*?"<>|]/g, '').trim();
      if (sanitized) {
        const currentName = file.getName();
        const ext = currentName.includes('.') ? currentName.split('.').pop() : 'jpg';
        const newName = sanitized + '.' + ext;
        if (currentName !== newName) {
          file.setName(newName);
          Logger.log('Berhasil diubah: ' + currentName + ' -> ' + newName);
          count++;
        }
      }
    }
  }
  Logger.log('Selesai! Total ' + count + ' foto diubah namanya di Google Drive.');
}
