package com.catsnis.dno.service;

import com.catsnis.dno.entity.Booklet;
import com.catsnis.dno.entity.Image;
import com.catsnis.dno.repository.ImageRepository;
import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookletPdfService {

    private final ImageRepository imageRepository;

    @Value("${app.upload.dir:/app/uploads/images}")
    private String uploadDir;

    // ── Charger les bytes du logo ─────────────────────────────────────────
    private byte[] loadLogoBytes() {
        try {
            String[] keywords = { "minist", "sant", "logo", "Logo" };
            Optional<Image> imageOpt = Optional.empty();

            for (String keyword : keywords) {
                imageOpt = imageRepository.findFirstByLabelContainingIgnoreCase(keyword);
                if (imageOpt.isPresent()) {
                    System.out.println("✅ Logo trouvé : " + imageOpt.get().getLabel());
                    break;
                }
            }

            if (imageOpt.isEmpty()) {
                List<Image> all = imageRepository.findAll();
                if (!all.isEmpty()) imageOpt = Optional.of(all.get(0));
            }

            if (imageOpt.isPresent()) {
                Path filePath = Paths.get(uploadDir, imageOpt.get().getFileName());
                System.out.println("🔍 Chemin logo : " + filePath.toAbsolutePath());
                if (Files.exists(filePath)) {
                    return Files.readAllBytes(filePath);
                } else {
                    System.out.println("❌ Fichier non trouvé : " + filePath);
                }
            }
        } catch (Exception e) {
            System.out.println("⚠️ Erreur chargement logo : " + e.getMessage());
        }
        return null;
    }

    // ── Filigrane centré (opacité basse) ──────────────────────────────────
    private void addWatermark(Document document, PageSize pageSize, byte[] logoBytes) {
        if (logoBytes == null) return;
        try {
            ImageData imageData = ImageDataFactory.create(logoBytes);
            com.itextpdf.layout.element.Image logo =
                    new com.itextpdf.layout.element.Image(imageData);
            logo.setOpacity(0.10f);
            logo.setFixedPosition(
                    (pageSize.getWidth()  - 350f) / 2,
                    (pageSize.getHeight() - 350f) / 2
            );
            logo.setWidth(350f);
            logo.setHeight(350f);
            document.add(logo);
        } catch (Exception e) {
            System.out.println("⚠️ Erreur filigrane : " + e.getMessage());
        }
    }

    // ── En-tête avec logo à gauche + titre au centre ──────────────────────
    private void addHeader(Document document, String title, byte[] logoBytes) {
        try {
            // Tableau 3 colonnes : logo | titre | vide
            Table header = new Table(UnitValue.createPercentArray(new float[]{20, 60, 20}))
                    .useAllAvailableWidth()
                    .setMarginBottom(10f);

            // ── Colonne gauche : logo ──────────────────────────────────────
            Cell logoCell = new Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE);

            if (logoBytes != null) {
                ImageData imageData = ImageDataFactory.create(logoBytes);
                com.itextpdf.layout.element.Image logo =
                        new com.itextpdf.layout.element.Image(imageData);
                logo.setWidth(70f);
                logo.setHeight(70f);
                logoCell.add(logo);
            }
            header.addCell(logoCell);

            // ── Colonne centre : titres ────────────────────────────────────
            Cell titleCell = new Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE);
            titleCell.add(new Paragraph("MINISTÈRE DE LA SANTÉ")
                    .setFontSize(11).setBold()
                    .setTextAlignment(TextAlignment.CENTER));
            titleCell.add(new Paragraph(title)
                    .setFontSize(16).setBold()
                    .setTextAlignment(TextAlignment.CENTER));
            titleCell.add(new Paragraph("─────────────────────────────────")
                    .setFontSize(9).setTextAlignment(TextAlignment.CENTER));
            header.addCell(titleCell);

            // ── Colonne droite : vide ──────────────────────────────────────
            header.addCell(new Cell()
                    .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));

            document.add(header);

        } catch (Exception e) {
            // Fallback sans logo
            document.add(new Paragraph("MINISTÈRE DE LA SANTÉ")
                    .setFontSize(11).setBold()
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph(title)
                    .setFontSize(16).setBold()
                    .setTextAlignment(TextAlignment.CENTER));
        }
    }

    // ── PDF individuel ────────────────────────────────────────────────────
    public byte[] generateBookletPdf(Booklet booklet) throws Exception {

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer           = new PdfWriter(baos);
        PdfDocument pdfDoc         = new PdfDocument(writer);
        Document document          = new Document(pdfDoc, PageSize.A4);

        // ✅ Charger les bytes une seule fois
        byte[] logoBytes = loadLogoBytes();

        // ✅ Filigrane en background
        addWatermark(document, PageSize.A4, logoBytes);

        // ✅ En-tête avec logo en haut à gauche
        addHeader(document, "CATUSNIS — BOOKLET", logoBytes);

        document.add(new Paragraph("\n"));

        // ── Tableau infos ─────────────────────────────────────────────────
        Table table = new Table(UnitValue.createPercentArray(new float[]{40, 60}))
                .useAllAvailableWidth();

        addRow(table, "Nom",      safe(booklet.getLastName()));
        addRow(table, "Prénom",   safe(booklet.getFirstName()));
        addRow(table, "Contact",  safe(booklet.getContact()));
        addRow(table, "Email",    safe(booklet.getEmail()));
        addRow(table, "Région",   booklet.getRegion()   != null ? booklet.getRegion().getRegionName()     : "-");
        addRow(table, "District", booklet.getDistrict() != null ? booklet.getDistrict().getDistrictName() : "-");
        addRow(table, "Poste",    booklet.getPost()     != null ? booklet.getPost().getPostName()         : "-");
        addRow(table, "Statut",   booklet.getStatus()   != null ? booklet.getStatus().getStatusName()     : "-");

        document.add(table);

        document.add(new Paragraph("\n\n"));
        document.add(new Paragraph("Date d'édition : " + LocalDate.now())
                .setFontSize(9).setTextAlignment(TextAlignment.RIGHT));

        document.close();
        return baos.toByteArray();
    }

    // ── PDF liste générale (Affectés + Réaffectés) ────────────────────────
    public byte[] generateListPdf(List<Booklet> booklets) throws Exception {

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer           = new PdfWriter(baos);
        PdfDocument pdfDoc         = new PdfDocument(writer);
        Document document          = new Document(pdfDoc, PageSize.A4.rotate());

        // ✅ Charger les bytes une seule fois
        byte[] logoBytes = loadLogoBytes();

        // ✅ Filigrane en background
        addWatermark(document, PageSize.A4.rotate(), logoBytes);

        // ✅ En-tête avec logo en haut à gauche
        addHeader(document, "CATUSNIS — LISTE DES AGENTS AFFECTÉS", logoBytes);

        document.add(new Paragraph("Date d'édition : " + LocalDate.now())
                .setFontSize(9).setTextAlignment(TextAlignment.RIGHT));

        document.add(new Paragraph("\n"));

        // ── Tableau ───────────────────────────────────────────────────────
        Table table = new Table(UnitValue.createPercentArray(
                new float[]{4, 10, 10, 10, 20, 12, 12, 12}))
                .useAllAvailableWidth();

        String[] headers = {"#", "Nom", "Prénom", "Contact", "Email", "Région", "District", "Poste"};
        for (String h : headers) {
            table.addHeaderCell(
                    new Cell().add(new Paragraph(h).setBold().setFontSize(9))
                            .setBackgroundColor(ColorConstants.LIGHT_GRAY)
            );
        }

        int index = 1;
        for (Booklet b : booklets) {
            table.addCell(new Cell().add(new Paragraph(String.valueOf(index++)).setFontSize(8)));
            table.addCell(new Cell().add(new Paragraph(safe(b.getLastName())).setFontSize(8)));
            table.addCell(new Cell().add(new Paragraph(safe(b.getFirstName())).setFontSize(8)));
            table.addCell(new Cell().add(new Paragraph(safe(b.getContact())).setFontSize(8)));
            table.addCell(new Cell().add(new Paragraph(safe(b.getEmail())).setFontSize(8)));
            table.addCell(new Cell().add(new Paragraph(
                    b.getRegion()   != null ? b.getRegion().getRegionName()     : "-").setFontSize(8)));
            table.addCell(new Cell().add(new Paragraph(
                    b.getDistrict() != null ? b.getDistrict().getDistrictName() : "-").setFontSize(8)));
            table.addCell(new Cell().add(new Paragraph(
                    b.getPost()     != null ? b.getPost().getPostName()         : "-").setFontSize(8)));
        }

        document.add(table);

        document.add(new Paragraph("\n"));
        document.add(new Paragraph("Total : " + booklets.size() + " agent(s)")
                .setFontSize(9).setBold()
                .setTextAlignment(TextAlignment.RIGHT));

        document.close();
        return baos.toByteArray();
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private void addRow(Table table, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setBold()));
        table.addCell(new Cell().add(new Paragraph(value)));
    }

    private String safe(String value) {
        return value != null ? value : "-";
    }
}