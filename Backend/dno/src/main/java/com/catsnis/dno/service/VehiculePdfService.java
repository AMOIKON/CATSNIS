package com.catsnis.dno.service;

import com.catsnis.dno.entity.Image;
import com.catsnis.dno.entity.Vehicule;
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
import java.text.SimpleDateFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Génère la fiche PDF d'un engin — même structure que DeploymentPdfService :
 * logo, QR code de vérification publique, tableau d'informations,
 * documents (assurance/visite technique/vignette), pied de page fixe.
 */
@Service
@RequiredArgsConstructor
public class VehiculePdfService {

    private final ImageRepository imageRepository;

    @Value("${app.frontend.url:http://localhost:3001}")
    private String appFrontendUrl;

    private final SimpleDateFormat dateFmt = new SimpleDateFormat("dd/MM/yyyy");

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
            System.out.println("⚠️ Erreur chargement logo (fiche véhicule) : " + e.getMessage());
        }
        return null;
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
        document.add(new Paragraph("FICHE ENGIN / VÉHICULE")
                .setBold().setFontSize(13).setTextAlignment(TextAlignment.CENTER));
        document.add(new LineSeparator(new SolidLine(1f)).setMarginBottom(14f));
    }

    private String safe(String value) {
        return (value != null && !value.isBlank()) ? value : "—";
    }

    private String safeDate(java.util.Date d) {
        return d != null ? dateFmt.format(d) : "—";
    }

    private void addInfoRow(Table table, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setBold().setFontSize(9))
                .setBackgroundColor(ColorConstants.LIGHT_GRAY).setPadding(5));
        table.addCell(new Cell().add(new Paragraph(safe(value)).setFontSize(9)).setPadding(5));
    }

    public byte[] generateVehiculePdf(Vehicule vehicule) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer   = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document  = new Document(pdfDoc, PageSize.A4);
        document.setMargins(28f, 36f, 24f, 36f);

        byte[] logoBytes = loadLogoBytes();
        addWatermark(document, PageSize.A4, logoBytes);
        addHeader(document, logoBytes);

        // ── QR code — vers la consultation PUBLIQUE ──────────────────────────
        try {
            String qrContent = appFrontendUrl + "/verify-vehicule/" + vehicule.getId();
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

        Table infoTable = new Table(UnitValue.createPercentArray(new float[]{35, 65}))
                .useAllAvailableWidth().setMarginBottom(14f);
        addInfoRow(infoTable, "Immatriculation", vehicule.getImmatriculation());
        addInfoRow(infoTable, "Type", vehicule.getType() != null ? vehicule.getType().name() : null);
        addInfoRow(infoTable, "Marque / Modèle",
                safe(vehicule.getMarque()) + " " + safe(vehicule.getModele()));
        addInfoRow(infoTable, "Couleur", vehicule.getCouleur());
        addInfoRow(infoTable, "Statut", vehicule.getStatut() != null ? vehicule.getStatut().name() : null);
        addInfoRow(infoTable, "Kilométrage",
                vehicule.getKilometrage() != null ? vehicule.getKilometrage() + " km" : null);
        addInfoRow(infoTable, "Région", vehicule.getRegion() != null ? vehicule.getRegion().getRegionName() : null);
        addInfoRow(infoTable, "District", vehicule.getDistrict() != null ? vehicule.getDistrict().getDistrictName() : null);
        if (vehicule.getConducteur() != null) {
            addInfoRow(infoTable, "Conducteur",
                    vehicule.getConducteur().getFirstName() + " " + vehicule.getConducteur().getLastName());
        } else if (vehicule.getConducteurBooklet() != null) {
            addInfoRow(infoTable, "Conducteur",
                    vehicule.getConducteurBooklet().getFirstName() + " " + vehicule.getConducteurBooklet().getLastName());
        }
        document.add(infoTable);

        document.add(new Paragraph("Documents administratifs")
                .setBold().setFontSize(11).setMarginBottom(6f));
        Table docTable = new Table(UnitValue.createPercentArray(new float[]{40, 30, 30}))
                .useAllAvailableWidth().setMarginBottom(10f);
        for (String h : new String[]{"Document", "Début", "Fin"}) {
            docTable.addHeaderCell(new Cell().add(new Paragraph(h).setBold().setFontSize(8))
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY).setPadding(4));
        }
        docTable.addCell(new Cell().add(new Paragraph("Assurance").setFontSize(8)).setPadding(4));
        docTable.addCell(new Cell().add(new Paragraph(safeDate(vehicule.getDateAssurance())).setFontSize(8)).setPadding(4));
        docTable.addCell(new Cell().add(new Paragraph(safeDate(vehicule.getDateFinAssurance())).setFontSize(8)).setPadding(4));
        docTable.addCell(new Cell().add(new Paragraph("Visite technique").setFontSize(8)).setPadding(4));
        docTable.addCell(new Cell().add(new Paragraph(safeDate(vehicule.getDateVisiteTechnique())).setFontSize(8)).setPadding(4));
        docTable.addCell(new Cell().add(new Paragraph(safeDate(vehicule.getDateFinVisiteTechnique())).setFontSize(8)).setPadding(4));
        docTable.addCell(new Cell().add(new Paragraph("Vignette").setFontSize(8)).setPadding(4));
        docTable.addCell(new Cell().add(new Paragraph(safeDate(vehicule.getDateVignette())).setFontSize(8)).setPadding(4));
        docTable.addCell(new Cell().add(new Paragraph(safeDate(vehicule.getDateFinVignette())).setFontSize(8)).setPadding(4));
        document.add(docTable);

        if (vehicule.getObservations() != null && !vehicule.getObservations().isBlank()) {
            document.add(new Paragraph("Observations").setBold().setFontSize(11).setMarginBottom(4f));
            document.add(new Paragraph(vehicule.getObservations()).setFontSize(9).setMarginBottom(10f));
        }

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