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

// Professional Portrait ID Card Styles - Standard ID Card Size (8.5cm × 5.5cm)
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: '10mm',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: '55mm', // 5.5cm
    height: '85mm', // 8.5cm
    backgroundColor: '#ffffff',
    borderRadius: '6pt',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    border: '0.5pt solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  // Gradient Header Section
  headerGradient: {
    width: '100%',
    height: '14mm',
    backgroundColor: '#667eea',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '2mm',
    paddingBottom: '2mm',
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
    fontSize: '14pt',
    color: '#ffffff',
    letterSpacing: '2pt',
    fontFamily: 'Helvetica-Bold',
    marginBottom: '1mm',
  },
  courseIdText: {
    fontSize: '6pt',
    color: '#ffffff',
    letterSpacing: '0.5pt',
    fontFamily: 'Helvetica-Bold',
  },
  // Photo Section
  photoSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 3,
  },
  photoContainer: {
    width: 60,
    height: 60,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    overflow: 'hidden',
    aspectRatio: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholderPhoto: {
    width: '17mm',
    height: '17mm',
    borderRadius: '8.5mm',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
  },
  placeholderText: {
    fontSize: '5pt',
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'Helvetica',
  },
  // Content Section
  contentSection: {
    padding: '3mm',
    paddingTop: '2mm',
    display: 'flex',
    flexDirection: 'column',
  },
  studentIdBadge: {
    backgroundColor: '#667eea',
    padding: '1mm 2mm',
    borderRadius: '2pt',
    alignSelf: 'center',
    marginBottom: '1.5mm',
    marginTop: '0mm',
  },
  studentIdText: {
    fontSize: '6pt',
    color: '#ffffff',
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: '0.5pt',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '1mm',
  },
  infoLabel: {
    fontSize: '4.5pt',
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: '0.2pt',
    width: '16mm',
    flexShrink: 0,
  },
  infoValue: {
    fontSize: '5.5pt',
    color: '#0f172a',
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
    flex: 1,
  },
  divider: {
    height: '0.3pt',
    backgroundColor: '#cbd5e1',
    marginTop: '0.3mm',
    marginBottom: '0.7mm',
  },
  // Footer Signatures
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '1.5mm 3mm',
    paddingTop: '1mm',
    marginTop: 'auto',
    borderTop: '0.5pt solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  signatureContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  signatureImage: {
    width: '12mm',
    height: '5mm',
    objectFit: 'contain',
    marginBottom: '1mm',
  },
  signatureLabel: {
    fontSize: '4pt',
    color: '#1e293b',
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    marginTop: '0.5mm',
  },
  signaturePlaceholder: {
    width: '12mm',
    height: '5mm',
    border: '0.5pt dashed #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1mm',
    backgroundColor: '#ffffff',
    borderRadius: '1pt',
  },
  signaturePlaceholderText: {
    fontSize: '3.5pt',
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

