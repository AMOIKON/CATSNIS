package com.catsnis.dno.service;

import com.catsnis.dno.entity.DeploymentItem;
import com.catsnis.dno.entity.Image;
import com.catsnis.dno.entity.Intervention;
import com.catsnis.dno.entity.Person;
import com.catsnis.dno.repository.ImageRepository;
import com.catsnis.dno.repository.InterventionRepository;
import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.barcodes.BarcodeQRCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

/**
 * Génère la fiche d'intervention en PDF (même contenu que la fiche imprimée
 * côté frontend), pour être jointe à l'email envoyé au bénéficiaire.
 * Reprend le pattern de BookletPdfService (logos chargés depuis la table
 * Image, pas d'entité PrintConfig dédiée).
 */
@Service
@RequiredArgsConstructor
public class InterventionPdfService {

    private final ImageRepository imageRepository;
    private final InterventionRepository interventionRepository;

    @Value("${app.frontend.url:http://localhost:3001}")
    private String appFrontendUrl;

    private static final String PERSON_TAG    = "[Personne assistee]";
    private static final String EQUIPMENT_TAG = "[Equipement hors base]";
    private static final String STRUCTURE_TAG = "[Structure hors base]";
    private static final DeviceRgb INDIGO = new DeviceRgb(79, 70, 229);
    private static final DeviceRgb INDIGO_BG = new DeviceRgb(238, 237, 253);

    // ── Chargement du logo depuis la base (identique à BookletPdfService) ────
    private byte[] loadLogoBytes() {
        try {
            String[] keywords = { "minist", "sant", "logo", "Logo" };
            Optional<Image> imageOpt = Optional.empty();
            for (String keyword : keywords) {
                imageOpt = imageRepository.findFirstByLabelContainingIgnoreCase(keyword);
                if (imageOpt.isPresent()) break;
            }
            if (imageOpt.isEmpty()) {
                List<Image> all = imageRepository.findAll();
                if (!all.isEmpty()) imageOpt = Optional.of(all.get(0));
            }
            if (imageOpt.isPresent() && imageOpt.get().getData() != null
                    && imageOpt.get().getData().length > 0) {
                return imageOpt.get().getData();
            }
        } catch (Exception e) {
            System.out.println("⚠️ Erreur chargement logo (fiche intervention) : " + e.getMessage());
        }
        return null;
    }

    /** Décode une signature base64 (avec ou sans préfixe data:image/...;base64,) en bytes. */
    private byte[] decodeSignature(String signatureBase64) {
        if (signatureBase64 == null || signatureBase64.isBlank()) return null;
        try {
            String pure = signatureBase64.contains(",")
                    ? signatureBase64.substring(signatureBase64.indexOf(',') + 1)
                    : signatureBase64;
            return Base64.getDecoder().decode(pure);
        } catch (Exception e) {
            System.out.println("⚠️ Signature illisible : " + e.getMessage());
            return null;
        }
    }

    private void addWatermark(Document document, PageSize pageSize, byte[] logoBytes) {
        if (logoBytes == null) return;
        try {
            ImageData imageData = ImageDataFactory.create(logoBytes);
            com.itextpdf.layout.element.Image logo = new com.itextpdf.layout.element.Image(imageData);
            logo.setOpacity(0.08f);
            logo.setFixedPosition((pageSize.getWidth() - 320f) / 2, (pageSize.getHeight() - 320f) / 2);
            logo.setWidth(320f);
            logo.setHeight(320f);
            document.add(logo);
        } catch (Exception e) {
            System.out.println("⚠️ Erreur filigrane (fiche intervention) : " + e.getMessage());
        }
    }

    private void addHeader(Document document, byte[] logoBytes) {
        if (logoBytes != null) {
            try {
                ImageData imageData = ImageDataFactory.create(logoBytes);
                com.itextpdf.layout.element.Image logo = new com.itextpdf.layout.element.Image(imageData);
                logo.setWidth(60f);
                logo.setHeight(60f);
                logo.setHorizontalAlignment(HorizontalAlignment.CENTER);
                document.add(logo);
            } catch (Exception ignored) {}
        }
        document.add(new Paragraph("CATUSNIS")
                .setBold().setFontSize(16).setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(13, 110, 253)));
        document.add(new Paragraph("FICHE D'INTERVENTION")
                .setBold().setFontSize(13).setTextAlignment(TextAlignment.CENTER));
        document.add(new LineSeparator(new SolidLine(1f)).setMarginBottom(14f));
    }

    /** Retire les marqueurs internes avant affichage dans le PDF. */
    private String sanitizeComment(String comment) {
        if (comment == null) return "";
        return comment.replaceAll("\\s*\\|\\s*\\[[^\\]]*\\][^|]*", "").trim();
    }

    private String extractTag(String comment, String tag) {
        if (comment == null || !comment.contains(tag)) return null;
        int startIdx = comment.indexOf(tag + " ");
        if (startIdx < 0) return null;
        String rest = comment.substring(startIdx + (tag + " ").length());
        int nextTag = rest.indexOf(" | [");
        return (nextTag >= 0 ? rest.substring(0, nextTag) : rest).trim();
    }

    private String safe(String value) {
        return (value != null && !value.isBlank()) ? value : "—";
    }

    private void addInfoRow(Table table, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setBold().setFontSize(9))
                .setBackgroundColor(ColorConstants.LIGHT_GRAY).setPadding(5));
        table.addCell(new Cell().add(new Paragraph(safe(value)).setFontSize(9)).setPadding(5));
    }

    /**
     * Ajoute une signature dans une cellule : image si disponible, sinon
     * ligne blanche à signer à la main. Le nom est toujours imprimé dessous.
     */
    private Cell buildSignatureCell(String label, byte[] signatureBytes, String printedName) {
        Cell cell = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.CENTER);
        cell.add(new Paragraph(label).setBold().setFontSize(9));

        if (signatureBytes != null) {
            try {
                ImageData imageData = ImageDataFactory.create(signatureBytes);
                com.itextpdf.layout.element.Image sigImg = new com.itextpdf.layout.element.Image(imageData);
                sigImg.setWidth(140f);
                sigImg.setMaxHeight(50f);
                sigImg.setHorizontalAlignment(HorizontalAlignment.CENTER);
                cell.add(sigImg);
            } catch (Exception e) {
                cell.add(new Paragraph("\n\n\n"));
            }
        } else {
            cell.add(new Paragraph("\n\n\n"));
        }

        cell.add(new LineSeparator(new SolidLine(0.5f)).setWidth(160f));
        cell.add(new Paragraph(printedName != null ? printedName : "—")
                .setFontSize(8).setFontColor(ColorConstants.GRAY).setMarginTop(3f));
        return cell;
    }

    /**
     * Génère la fiche PDF d'une intervention, prête à être jointe à un email
     * ou téléchargée directement.
     */
    public byte[] generateInterventionPdf(Intervention intervention, Person technician) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer   = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document  = new Document(pdfDoc, PageSize.A4);

        byte[] logoBytes = loadLogoBytes();
        addWatermark(document, PageSize.A4, logoBytes);
        addHeader(document, logoBytes);

        SimpleDateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy");
        String dateStr = intervention.getDateInter() != null
                ? dateFormat.format(intervention.getDateInter()) : "—";
        String typeLabel = "EN_LIGNE".equals(intervention.getTypeInter()) ? "En ligne" : "Sur site";

        boolean isStructureEnregistree = intervention.getRegion() != null
                && intervention.getDistrict() != null && intervention.getHealth() != null;
        boolean isEquipmentHorsBase = intervention.getDeployment() == null;

        String comment = intervention.getCommentInter();

        // ✅ Badge visuel signalant une assistance technique hors base
        if (!isStructureEnregistree || isEquipmentHorsBase) {
            document.add(new Paragraph("⚠ ASSISTANCE TECHNIQUE — ÉLÉMENT(S) HORS BASE")
                    .setBold().setFontSize(9)
                    .setFontColor(INDIGO)
                    .setBackgroundColor(INDIGO_BG)
                    .setPadding(6f).setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(12f));
        }

        // ── Tableau d'informations générales ────────────────────────────────
        Table infoTable = new Table(UnitValue.createPercentArray(new float[]{35, 65}))
                .useAllAvailableWidth().setMarginBottom(14f);
        addInfoRow(infoTable, "Code intervention", intervention.getCodeInter());
        addInfoRow(infoTable, "Date", dateStr);
        addInfoRow(infoTable, "Durée", intervention.getDurationMinutes() + " min");
        addInfoRow(infoTable, "Type d'intervention", typeLabel);
        addInfoRow(infoTable, "Application",
                intervention.getApps() != null ? intervention.getApps().getAppName() : null);

        if (isStructureEnregistree) {
            addInfoRow(infoTable, "Région", intervention.getRegion().getRegionName());
            addInfoRow(infoTable, "District", intervention.getDistrict().getDistrictName());
            addInfoRow(infoTable, "Site", intervention.getHealth().getHealthName());

            // ✅ Historique — "Xe intervention sur ce site"
            try {
                long count = interventionRepository.countByHealth_Id(intervention.getHealth().getId());
                addInfoRow(infoTable, "Historique",
                        count + (count > 1 ? "e intervention sur ce site" : "re intervention sur ce site"));
            } catch (Exception ignored) {}
        } else {
            addInfoRow(infoTable, "Structure", extractTag(comment, STRUCTURE_TAG));
        }

        addInfoRow(infoTable, "Réalisée par",
                technician.getFirstName() + " " + technician.getLastName());

        String personName;
        if (intervention.getBooklet() != null) {
            personName = intervention.getBooklet().getLastName() + " " + intervention.getBooklet().getFirstName();
        } else {
            personName = extractTag(comment, PERSON_TAG);
        }
        addInfoRow(infoTable, "Personne assistée", personName);

        String equipName = extractTag(comment, EQUIPMENT_TAG);
        if (intervention.getDeployment() == null && equipName != null) {
            addInfoRow(infoTable, "Équipement (hors base)", equipName);
        }

        if (intervention.getPartner() != null) {
            addInfoRow(infoTable, "Bailleur / Partenaire", intervention.getPartner().getPartnerName());
        }

        if (intervention.getLatitude() != null && intervention.getLongitude() != null) {
            addInfoRow(infoTable, "Coordonnées GPS",
                    String.format("%.6f, %.6f", intervention.getLatitude(), intervention.getLongitude()));
        }

        document.add(infoTable);

        // ── Tableau des équipements inventoriés (si présents) ───────────────
        List<DeploymentItem> items = (intervention.getDeployment() != null)
                ? intervention.getDeployment().getItems() : null;

        if (items != null && !items.isEmpty()) {
            document.add(new Paragraph("Équipements concernés")
                    .setBold().setFontSize(11).setMarginBottom(6f));

            Table eqTable = new Table(UnitValue.createPercentArray(new float[]{20, 20, 20, 20, 20}))
                    .useAllAvailableWidth().setMarginBottom(14f);
            for (String h : new String[]{"Type", "Tag", "N° Série", "État avant", "État après"}) {
                eqTable.addHeaderCell(new Cell().add(new Paragraph(h).setBold().setFontSize(8))
                        .setBackgroundColor(ColorConstants.LIGHT_GRAY).setPadding(4));
            }
            for (DeploymentItem item : items) {
                eqTable.addCell(new Cell().add(new Paragraph(safe(
                        item.getAcquisition() != null ? item.getAcquisition().getTypes().getTypeName() : null))
                        .setFontSize(8)).setPadding(4));
                eqTable.addCell(new Cell().add(new Paragraph(safe(
                        item.getAcquisition() != null ? item.getAcquisition().getTag() : null))
                        .setFontSize(8)).setPadding(4));
                eqTable.addCell(new Cell().add(new Paragraph(safe(
                        item.getAcquisition() != null ? item.getAcquisition().getSerial() : null))
                        .setFontSize(8)).setPadding(4));
                eqTable.addCell(new Cell().add(new Paragraph(safe(item.getEtatAvant())).setFontSize(8)).setPadding(4));
                eqTable.addCell(new Cell().add(new Paragraph(safe(item.getEtatApres())).setFontSize(8)).setPadding(4));
            }
            document.add(eqTable);
        }

        // ── Commentaire ──────────────────────────────────────────────────────
        String cleanComment = sanitizeComment(comment);
        if (!cleanComment.isBlank()) {
            document.add(new Paragraph("Commentaire").setBold().setFontSize(11).setMarginBottom(4f));
            document.add(new Paragraph(cleanComment).setFontSize(9).setMarginBottom(20f));
        }

        // ── Signatures ────────────────────────────────────────────────────────
        // Image si le technicien a enregistré une signature numérique dans son
        // profil, sinon ligne blanche + nom imprimé (signature manuscrite).
        byte[] technicianSignature = decodeSignature(technician.getSignatureBase64());
        String technicianName = technician.getFirstName() + " " + technician.getLastName();

        Table sigTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .useAllAvailableWidth().setMarginTop(30f);
        sigTable.addCell(buildSignatureCell("Signature Technicien", technicianSignature, technicianName));
        sigTable.addCell(buildSignatureCell("Signature Bénéficiaire", null, personName));
        document.add(sigTable);

        // ── QR code — pointe vers une page de consultation PUBLIQUE (sans connexion) ──
        // ⚠️ Nécessite la dépendance Maven com.itextpdf:barcodes (à ajouter au
        //    pom.xml si absente — même groupId que itext7-kernel/layout déjà utilisés).
        try {
            String qrContent = appFrontendUrl + "/verify/" + intervention.getId();
            BarcodeQRCode qrCode = new BarcodeQRCode(qrContent);
            com.itextpdf.layout.element.Image qrImage =
                    new com.itextpdf.layout.element.Image(qrCode.createFormXObject(pdfDoc));
            qrImage.setWidth(60f);
            qrImage.setHeight(60f);
            qrImage.setFixedPosition(30, 40);
            document.add(qrImage);
            document.showTextAligned(
                    new Paragraph("Scanner pour vérifier").setFontSize(6).setFontColor(ColorConstants.GRAY),
                    60, 32, pdfDoc.getNumberOfPages(), TextAlignment.CENTER, null, 0);
        } catch (Exception e) {
            System.out.println("⚠️ QR code non généré (dépendance barcodes manquante ?) : " + e.getMessage());
        }

        document.add(new Paragraph("CATUSNIS — Document généré automatiquement le "
                + new SimpleDateFormat("dd/MM/yyyy à HH:mm").format(new java.util.Date()))
                .setFontSize(7).setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(30f));

        // ── Numérotation de page (le nombre total est connu une fois tout le contenu ajouté) ──
        int totalPages = pdfDoc.getNumberOfPages();
        for (int i = 1; i <= totalPages; i++) {
            Rectangle pageSize = pdfDoc.getPage(i).getPageSize();
            document.showTextAligned(
                    new Paragraph("Page " + i + "/" + totalPages).setFontSize(7).setFontColor(ColorConstants.GRAY),
                    pageSize.getWidth() - 40, 20, i, TextAlignment.RIGHT, null, 0);
        }

        document.close();
        return baos.toByteArray();
    }
}