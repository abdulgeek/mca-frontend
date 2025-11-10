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
  // Compact Header with Photo and ID
  compactHeader: {
    width: '100%',
    backgroundColor: '#667eea',
    padding: '2.5mm',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopLeftRadius: '6pt',
    borderTopRightRadius: '6pt',
  },
  photoContainer: {
    width: '13mm',
    height: '13mm',
    borderRadius: '2mm',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
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
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: '2mm',
  },
  studentIdBadge: {
    backgroundColor: '#ffffff',
    padding: '1.5mm 3.5mm',
    borderRadius: '2pt',
    marginBottom: '1mm',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mcaLabelText: {
    fontSize: '9pt',
    color: 'black',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: '1.5pt',
    marginBottom: '0.5mm',
  },
  studentIdText: {
    fontSize: '6pt',
    color: 'black',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: '0.2pt',
  },
  studentIdHeader: {
    fontSize: '5.5pt',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    maxWidth: '35mm',
    marginBottom: '0.5mm',
    opacity: 0.9,
  },
  studentNameHeader: {
    fontSize: '7pt',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    maxWidth: '35mm',
  },
  // Content Section with Larger Fonts
  contentSection: {
    padding: '3mm',
    paddingTop: '2.5mm',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '2mm',
  },
  infoLabel: {
    fontSize: '6pt',
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: '0.3pt',
    marginRight: '2mm',
    minWidth: '18mm',
  },
  infoValue: {
    fontSize: '7pt',
    color: 'black',
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
    flex: 1,
  },
  infoValueUppercase: {
    fontSize: '7pt',
    color: 'black',
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
    flex: 1,
    textTransform: 'uppercase',
  },
  divider: {
    height: '0.5pt',
    backgroundColor: '#e2e8f0',
    marginTop: '0.5mm',
    marginBottom: '1.5mm',
  },
  // Compact Footer Signatures
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '2mm 3mm',
    paddingTop: '1.5mm',
    borderTop: '0.5pt solid #e2e8f0',
    backgroundColor: '#f8fafc',
    borderBottomLeftRadius: '6pt',
    borderBottomRightRadius: '6pt',
  },
  signatureContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  signatureImage: {
    width: '18mm',
    height: '7mm',
    objectFit: 'contain',
    marginBottom: '0.5mm',
  },
  signatureLabel: {
    fontSize: '5.5pt',
    color: 'black',
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.3,
    marginTop: '0.5mm',
  },
  signaturePlaceholder: {
    width: '18mm',
    height: '7mm',
    border: '0.5pt dashed #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5mm',
    backgroundColor: '#ffffff',
    borderRadius: '1pt',
  },
  signaturePlaceholderText: {
    fontSize: '4pt',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 1.2,
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
          {/* Compact Header with Photo and Student ID */}
          <View style={styles.compactHeader}>
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

            <View style={styles.headerRight}>
              <View style={styles.studentIdBadge}>
                <Text style={styles.mcaLabelText}>MCA</Text>
                <Text style={styles.studentIdText}>{student.studentId}</Text>
              </View>
            </View>
          </View>

          {/* Content Section with Larger Fonts */}
          <View style={styles.contentSection}>
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValueUppercase}>{student.name}</Text>
              </View>
              <View style={styles.divider} />

              {student.fatherName && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Father's Name</Text>
                    <Text style={styles.infoValueUppercase}>{student.fatherName}</Text>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {student.motherName && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mother's Name</Text>
                    <Text style={styles.infoValueUppercase}>{student.motherName}</Text>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {student.bloodGroup && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Blood Group</Text>
                    <Text style={styles.infoValueUppercase}>{student.bloodGroup}</Text>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{student.email}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Course</Text>
                <Text style={styles.infoValueUppercase}>{student.course}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValueUppercase}>{student.phone}</Text>
              </View>
            </View>
          </View>

          {/* Footer - Signatures */}
          <View style={styles.footer}>
            <View style={styles.signatureContainer}>
              {ceoSignatureUrl ? (
                <>
                  <PdfImage src={ceoSignatureUrl} style={styles.signatureImage} />
                  <Text style={styles.signatureLabel}>Managing{'\n'}Director</Text>
                </>
              ) : (
                <>
                  <View style={styles.signaturePlaceholder}>
                    <Text style={styles.signaturePlaceholderText}>Managing Director{'\n'}Signature</Text>
                  </View>
                  <Text style={styles.signatureLabel}>Managing{'\n'}Director</Text>
                </>
              )}
            </View>

            <View style={styles.signatureContainer}>
              {courseDirectorSignatureUrl ? (
                <>
                  <PdfImage src={courseDirectorSignatureUrl} style={styles.signatureImage} />
                  <Text style={styles.signatureLabel}>Course{'\n'}Director</Text>
                </>
              ) : (
                <>
                  <View style={styles.signaturePlaceholder}>
                    <Text style={styles.signaturePlaceholderText}>Course Director{'\n'}Signature</Text>
                  </View>
                  <Text style={styles.signatureLabel}>Course{'\n'}Director</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};


