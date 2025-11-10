import { FC } from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image as PdfImage,
  Font,
} from '@react-pdf/renderer';
import { StudentListItem } from '../types';

// Register fonts
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0bf8pkAp6a.woff2',
  fontStyle: 'normal',
  fontWeight: 'normal',
});

Font.register({
  family: 'Helvetica-Bold',
  src: 'https://fonts.gstatic.com/s/opensans/v18/mem5YaGs126MiZpBA-UN7rgOUuhpKKSTjw.woff2',
  fontStyle: 'normal',
  fontWeight: 'bold',
});

interface StudentIDCardPDFProps {
  student: StudentListItem;
  ceoSignatureUrl?: string;
  courseDirectorSignatureUrl?: string;
}

// Professional Portrait ID Card Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: '20mm',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: '90mm', // Portrait ID card width
    height: '150mm', // Portrait ID card height (increased)
    backgroundColor: '#ffffff',
    borderRadius: '12pt',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    border: '1pt solid #e2e8f0',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },
  // Gradient Header Section
  headerGradient: {
    width: '100%',
    height: '36mm',
    backgroundColor: '#667eea',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '6mm',
    paddingBottom: '6mm',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  mcaText: {
    fontSize: '28pt',
    color: '#ffffff',
    letterSpacing: '5pt',
    fontFamily: 'Helvetica-Bold',
    marginBottom: '2mm',
  },
  courseIdText: {
    fontSize: '10pt',
    color: '#ffffff',
    letterSpacing: '1pt',
    fontFamily: 'Helvetica-Bold',
  },
  // Photo Section
  photoSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    aspectRatio: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholderPhoto: {
    width: '36mm',
    height: '36mm',
    borderRadius: '18mm',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
  },
  placeholderText: {
    fontSize: '9pt',
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'Helvetica',
  },
  // Content Section
  contentSection: {
    padding: '6mm',
    paddingTop: '4mm',
    display: 'flex',
    flexDirection: 'column',
  },
  studentIdBadge: {
    backgroundColor: '#667eea',
    padding: '2mm 4mm',
    borderRadius: '4pt',
    alignSelf: 'center',
    marginBottom: '3mm',
    marginTop: '0mm',
  },
  studentIdText: {
    fontSize: '11pt',
    color: '#ffffff',
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: '1pt',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '2.5mm',
  },
  infoLabel: {
    fontSize: '8pt',
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5pt',
    width: '35mm',
    flexShrink: 0,
  },
  infoValue: {
    fontSize: '10pt',
    color: '#0f172a',
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    flex: 1,
  },
  divider: {
    height: '0.5pt',
    backgroundColor: '#cbd5e1',
    marginTop: '0.5mm',
    marginBottom: '1.5mm',
  },
  // Footer Signatures
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '3mm 6mm',
    paddingTop: '2mm',
    marginTop: '3mm',
    borderTop: '1pt solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  signatureContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  signatureImage: {
    width: '28mm',
    height: '10mm',
    objectFit: 'contain',
    marginBottom: '2mm',
  },
  signatureLabel: {
    fontSize: '8pt',
    color: '#1e293b',
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    marginTop: '1mm',
  },
  signaturePlaceholder: {
    width: '28mm',
    height: '10mm',
    border: '1pt dashed #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '2mm',
    backgroundColor: '#ffffff',
    borderRadius: '2pt',
  },
  signaturePlaceholderText: {
    fontSize: '6pt',
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export const StudentIDCardPDF: FC<StudentIDCardPDFProps> = ({
  student,
  ceoSignatureUrl,
  courseDirectorSignatureUrl,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.cardContainer}>
          {/* Gradient Header with MCA Text and Course ID */}
          <View style={styles.headerGradient}>
            <Text style={styles.mcaText}>MCA</Text>
            <Text style={styles.courseIdText}>{student.studentId}</Text>
          </View>

          {/* Photo Section */}
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              {student.profileImageUrl ? (
                <View style={styles.photoWrapper}>
                  <PdfImage
                    src={student.profileImageUrl}
                    style={styles.photo}
                    cache={false}
                  />
                </View>
              ) : (
                <View style={styles.placeholderPhoto}>
                  <Text style={styles.placeholderText}>NO PHOTO</Text>
                </View>
              )}
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            {/* Student Information */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{student.name}</Text>
              </View>

              <View style={styles.divider} />

              {student.fatherName && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Father's Name</Text>
                    <Text style={styles.infoValue}>{student.fatherName}</Text>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {student.motherName && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mother's Name</Text>
                    <Text style={styles.infoValue}>{student.motherName}</Text>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {student.bloodGroup && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Blood Group</Text>
                    <Text style={styles.infoValue}>{student.bloodGroup}</Text>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{student.email}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Course</Text>
                <Text style={styles.infoValue}>{student.course}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{student.phone}</Text>
              </View>
            </View>
          </View>

          {/* Footer - Signatures */}
          <View style={styles.footer}>
            <View style={styles.signatureContainer}>
              {ceoSignatureUrl ? (
                <PdfImage src={ceoSignatureUrl} style={styles.signatureImage} />
              ) : (
                <View style={styles.signaturePlaceholder}>
                  <Text style={styles.signaturePlaceholderText}>Managing Director</Text>
                </View>
              )}
              <Text style={styles.signatureLabel}>Managing Director</Text>
            </View>

            <View style={styles.signatureContainer}>
              {courseDirectorSignatureUrl ? (
                <PdfImage src={courseDirectorSignatureUrl} style={styles.signatureImage} />
              ) : (
                <View style={styles.signaturePlaceholder}>
                  <Text style={styles.signaturePlaceholderText}>Course Director</Text>
                </View>
              )}
              <Text style={styles.signatureLabel}>Course Director</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

