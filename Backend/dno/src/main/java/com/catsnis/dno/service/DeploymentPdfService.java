package com.catsnis.dno.service;

import com.catsnis.dno.entity.Deployment;
import com.catsnis.dno.entity.DeploymentItem;
import com.catsnis.dno.entity.Image;
import com.catsnis.dno.entity.Person;
import com.catsnis.dno.repository.ImageRepository;
import com.itextpdf.barcodes.BarcodeQRCode;
import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
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
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

/**
 * Génère la fiche de déploiement en PDF — même structure que la fiche
 * d'intervention (InterventionPdfService) : logo, QR code de vérification
 * publique, tableau d'informations, liste des équipements, signature
 * numérique du technicien, pied de page fixe.
 */
@Service
@RequiredArgsConstructor


public class DeploymentPdfService {

    private final ImageRepository imageRepository;

    @Value("${app.frontend.url:http://localhost:3001}")
    private String appFrontendUrl;

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
            System.out.println("⚠️ Erreur chargement logo (fiche déploiement) : " + e.getMessage());
        }
        return null;
    }

    private byte[] decodeSignature(String signatureBase64) {
        if (signatureBase64 == null || signatureBase64.isBlank()) return null;
        try {
            String pure = signatureBase64.contains(",")
                    ? signatureBase64.substring(signatureBase64.indexOf(',') + 1)
                    : signatureBase64;
            return Base64.getDecoder().decode(pure);
        } catch (Exception e) {
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
        } catch (Exception ignored) {}
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
        document.add(new Paragraph("FICHE DE DÉPLOIEMENT")
                .setBold().setFontSize(13).setTextAlignment(TextAlignment.CENTER));
        document.add(new LineSeparator(new SolidLine(1f)).setMarginBottom(14f));
    }

    private String safe(String value) {
        return (value != null && !value.isBlank()) ? value : "—";
    }

    private void addInfoRow(Table table, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setBold().setFontSize(9))
                .setBackgroundColor(ColorConstants.LIGHT_GRAY).setPadding(5));
        table.addCell(new Cell().add(new Paragraph(safe(value)).setFontSize(9)).setPadding(5));
    }

    // ✅ MODIFIÉ — accepte maintenant un contact optionnel affiché sous le nom
    private Cell buildSignatureCell(String label, byte[] signatureBytes, String printedName, String contact) {
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
        // ✅ NOUVEAU — contact affiché sous le nom, si disponible
        if (contact != null && !contact.isBlank()) {
            cell.add(new Paragraph(contact)
                    .setFontSize(7).setFontColor(ColorConstants.GRAY));
        }
        return cell;
    }

    public byte[] generateDeploymentPdf(Deployment deployment, Person technician) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer   = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document  = new Document(pdfDoc, PageSize.A4);
        document.setMargins(28f, 36f, 24f, 36f);

        byte[] logoBytes = loadLogoBytes();
        addWatermark(document, PageSize.A4, logoBytes);
        addHeader(document, logoBytes);

        // ── QR code — en haut à droite, vers la consultation PUBLIQUE ────────
        try {
            String qrContent = appFrontendUrl + "/verify-deployment/" + deployment.getId();
            BarcodeQRCode qrCode = new BarcodeQRCode(qrContent);
            com.itextpdf.layout.element.Image qrImage =
                    new com.itextpdf.layout.element.Image(qrCode.createFormXObject(pdfDoc));
            qrImage.setWidth(55f);
            qrImage.setHeight(55f);
            float pageWidth = PageSize.A4.getWidth();
            float pageHeight = PageSize.A4.getHeight();
            qrImage.setFixedPosition(pageWidth - 90, pageHeight - 100);
            document.add(qrImage);
            document.showTextAligned(
                    new Paragraph("Scanner pour vérifier").setFontSize(6).setFontColor(ColorConstants.GRAY),
                    pageWidth - 62, pageHeight - 105, 1, TextAlignment.CENTER, null, 0);
        } catch (Exception e) {
            System.out.println("⚠️ QR code non généré (dépendance barcodes manquante ?) : " + e.getMessage());
        }

        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String dateStr = deployment.getDateRecep() != null
                ? deployment.getDateRecep().format(dateFormat) : "—";

        Table infoTable = new Table(UnitValue.createPercentArray(new float[]{35, 65}))
                .useAllAvailableWidth().setMarginBottom(14f);
        addInfoRow(infoTable, "Code déploiement", deployment.getCodeDep());
        addInfoRow(infoTable, "Date de réception", dateStr);
        addInfoRow(infoTable, "Région", deployment.getRegion() != null ? deployment.getRegion().getRegionName() : null);
        addInfoRow(infoTable, "District", deployment.getDistrict() != null ? deployment.getDistrict().getDistrictName() : null);
        // ✅ Site peut être null (déploiement remis à un Convoyeur, sans site précis)
        addInfoRow(infoTable, "Site", deployment.getHealth() != null
                ? deployment.getHealth().getHealthName() : "Non renseigné (convoyage)");
        addInfoRow(infoTable, "Application", deployment.getApps() != null ? deployment.getApps().getAppName() : null);
        addInfoRow(infoTable, "Réalisé par", technician.getFirstName() + " " + technician.getLastName());
        // ✅ NOUVEAU — Contact du technicien
        if (technician.getContact() != null && !technician.getContact().isBlank()) {
            addInfoRow(infoTable, "Contact technicien", technician.getContact());
        }
        if (deployment.getPartner() != null) {
            addInfoRow(infoTable, "Bailleur / Partenaire", deployment.getPartner().getPartnerName());
        }

        // ── Personne réceptionnaire (booklet sélectionné OU saisie manuelle) ──
        String receivedByDisplayName = deployment.getReceivedByName();
        if ((receivedByDisplayName == null || receivedByDisplayName.isBlank())
                && deployment.getReceivedByBooklet() != null) {
            receivedByDisplayName = deployment.getReceivedByBooklet().getLastName()
                    + " " + deployment.getReceivedByBooklet().getFirstName();
        }

// ✅ MODIFIÉ — nom et contact réunis sur la même ligne
        String receivedByContactForInfo = deployment.getReceivedByContact();
        if ((receivedByContactForInfo == null || receivedByContactForInfo.isBlank())
                && deployment.getReceivedByBooklet() != null) {
            receivedByContactForInfo = deployment.getReceivedByBooklet().getContact();
        }
        if (receivedByDisplayName != null && !receivedByDisplayName.isBlank()) {
            String receptionnaireLigne = receivedByDisplayName;
            if (receivedByContactForInfo != null && !receivedByContactForInfo.isBlank()) {
                receptionnaireLigne += " — " + receivedByContactForInfo;
            }
            addInfoRow(infoTable, "Personne réceptionnaire", receptionnaireLigne);
        }
        if (deployment.getReceivedByPost() != null && !deployment.getReceivedByPost().isBlank()) {
            addInfoRow(infoTable, "Poste réceptionnaire", deployment.getReceivedByPost());
        }



        if (deployment.getLatitude() != null && deployment.getLongitude() != null) {
            addInfoRow(infoTable, "Coordonnées GPS",
                    String.format("%.6f, %.6f", deployment.getLatitude(), deployment.getLongitude()));
        }
        document.add(infoTable);

        List<DeploymentItem> items = deployment.getItems();
        if (items != null && !items.isEmpty()) {
            document.add(new Paragraph("Équipements déployés")
                    .setBold().setFontSize(11).setMarginBottom(6f));

            Table eqTable = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25}))
                    .useAllAvailableWidth().setMarginBottom(8f);
            for (String h : new String[]{"Type", "Tag", "N° Série", "Statut"}) {
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
                eqTable.addCell(new Cell().add(new Paragraph(safe(item.getStatus())).setFontSize(8)).setPadding(4));
            }
            document.add(eqTable);
        }

        if (deployment.getComment() != null && !deployment.getComment().isBlank()) {
            document.add(new Paragraph("Commentaire").setBold().setFontSize(11).setMarginBottom(4f));
            document.add(new Paragraph(deployment.getComment()).setFontSize(9).setMarginBottom(10f));
        }

        // ✅ MODIFIÉ — zone signature enrichie :
        // gauche = Technicien (nom + contact) ; droite = Personne réceptionnaire
        // (nom + contact) au lieu du générique "Signature Responsable du site"
        Table sigTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .useAllAvailableWidth().setMarginTop(18f);
        byte[] technicianSignature = decodeSignature(technician.getSignatureBase64());
        sigTable.addCell(buildSignatureCell(
                "Signature Technicien",
                technicianSignature,
                technician.getFirstName() + " " + technician.getLastName(),
                technician.getContact()));

        String receivedBySignatureContact = deployment.getReceivedByContact();
        if ((receivedBySignatureContact == null || receivedBySignatureContact.isBlank())
                && deployment.getReceivedByBooklet() != null) {
            receivedBySignatureContact = deployment.getReceivedByBooklet().getContact();
        }
        sigTable.addCell(buildSignatureCell(
                "Signature Personne réceptionnaire",
                null,
                (receivedByDisplayName != null && !receivedByDisplayName.isBlank()) ? receivedByDisplayName : null,
                receivedBySignatureContact));
        document.add(sigTable);

        String generatedOn = "CATUSNIS — Document généré automatiquement le "
                + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));
        document.add(new LineSeparator(new SolidLine(0.5f)).setMarginTop(15f).setMarginBottom(4f));
        document.add(new Paragraph(generatedOn)
                .setFontSize(7).setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER));

        document.close();
        return baos.toByteArray();
    }

}