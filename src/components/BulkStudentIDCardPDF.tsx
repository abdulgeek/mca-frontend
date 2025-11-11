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

// Register Font Awesome Solid font for icons
Font.register({
  family: 'FontAwesome',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  fontStyle: 'normal',
  fontWeight: 'normal',
});

// Font Awesome icon Unicode mappings
const Icons = {
  location: '\uf3c5',
  phone: '\uf095',
  email: '\uf0e0',
  globe: '\uf0ac',
} as const;

interface BulkStudentIDCardPDFProps {
  students: StudentListItem[];
  ceoSignatureUrl?: string;
  courseDirectorSignatureUrl?: string;
  academyLogoUrl?: string;
  academyAddress?: string;
  academyPhone?: string;
  academyEmail?: string;
  academyWebsite?: string;
}

// Standard ID Card Size (8.5cm × 5.5cm)
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: '5mm',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: '3mm',
  },
  cardWrapper: {
    width: '55mm',
    height: '85mm',
    marginBottom: '3mm',
  },
  cardContainer: {
    width: '55mm',
    height: '85mm',
    backgroundColor: '#ffffff',
    borderRadius: '6pt',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    border: '0.5pt solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  // Front Card Styles
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
    wordBreak: 'break-all',
    maxWidth: '100%',
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
  // Backside Styles
  backsideContainer: {
    width: '55mm',
    height: '85mm',
    backgroundColor: '#ffffff',
    borderRadius: '6pt',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    border: '0.5pt solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  backsideHeader: {
    width: '100%',
    backgroundColor: '#667eea',
    padding: '2.5mm',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: '6pt',
    borderTopRightRadius: '6pt',
  },
  academyLogoContainer: {
    width: '16mm',
    height: '16mm',
    marginBottom: '1mm',
    backgroundColor: '#ffffff',
    borderRadius: '8mm',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5mm',
    border: '1pt solid #e2e8f0',
    overflow: 'hidden',
  },
  academyLogoWrapper: {
    width: '13mm',
    height: '13mm',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '-1.5mm',
  },
  academyLogo: {
    width: '13mm',
    height: '13mm',
    objectFit: 'contain',
    maxWidth: '13mm',
    maxHeight: '13mm',
  },
  logoPlaceholder: {
    width: '13mm',
    height: '13mm',
    backgroundColor: '#667eea',
    borderRadius: '6.5mm',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    fontSize: '6pt',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
  academyNameLarge: {
    fontSize: '8pt',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    letterSpacing: '0.8pt',
    lineHeight: 1.2,
  },
  backsideContent: {
    padding: '3mm',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '1.5mm',
    marginTop: '0.5mm',
  },
  qrCodeContainer: {
    width: '18mm',
    height: '18mm',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1mm',
  },
  qrCode: {
    width: '16mm',
    height: '16mm',
    objectFit: 'contain',
  },
  qrLabel: {
    fontSize: '5pt',
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: '0.3pt',
  },
  contactSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5mm',
  },
  contactRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: '1.2mm',
  },
  contactIcon: {
    fontSize: '6pt',
    color: '#667eea',
    marginRight: '1mm',
    fontFamily: 'FontAwesome',
    width: '2.5mm',
    textAlign: 'center',
  },
  contactLabel: {
    fontSize: '5pt',
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
    marginRight: '1mm',
    minWidth: '8mm',
  },
  contactText: {
    fontSize: '5.5pt',
    color: '#1e293b',
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
    flex: 1,
  },
  addressText: {
    fontSize: '5pt',
    color: '#1e293b',
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    flex: 1,
  },
  backsideFooter: {
    padding: '2mm',
    backgroundColor: '#f8fafc',
    borderTop: '0.5pt solid #e2e8f0',
    borderBottomLeftRadius: '6pt',
    borderBottomRightRadius: '6pt',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: '5pt',
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
  },
  sectionDivider: {
    height: '0.5pt',
    backgroundColor: '#e2e8f0',
    marginTop: '1mm',
    marginBottom: '1mm',
  },
  phoneRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '1.2mm',
    gap: '2mm',
  },
  phoneItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  phoneLabel: {
    fontSize: '5pt',
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
    marginRight: '0.8mm',
  },
  phoneNumber: {
    fontSize: '5.5pt',
    color: '#1e293b',
    fontFamily: 'Helvetica',
  },
});

// Helper component to render a single front card
const FrontCard: FC<{
  student: StudentListItem;
  ceoSignatureUrl?: string;
  courseDirectorSignatureUrl?: string;
}> = ({ student, ceoSignatureUrl, courseDirectorSignatureUrl }) => (
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

    {/* Content Section */}
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
          <Text style={[styles.infoValue, { fontSize: '6pt' }]}>{student.email}</Text>
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
);

// Helper component to render a single back card
const BackCard: FC<{
  academyLogoUrl?: string;
  academyAddress: string;
  academyPhone: string;
  academyEmail: string;
  academyWebsite: string;
}> = ({ academyLogoUrl, academyAddress, academyPhone, academyEmail, academyWebsite }) => {
  const generateQRCodeUrl = () => {
    const googleMapsUrl = 'https://maps.google.com/?q=Madani+Computer+Academy,+Sagayapuram,+4/1,+12th+Cross+Rd,+Richards+Town,+Bengaluru,+Karnataka+560084';
    const qrData = encodeURIComponent(googleMapsUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
  };

  return (
    <View style={styles.backsideContainer}>
      {/* Header with Logo and Academy Name */}
      <View style={styles.backsideHeader}>
        <View style={styles.academyLogoContainer}>
          {academyLogoUrl ? (
            <View style={styles.academyLogoWrapper}>
              <PdfImage src={academyLogoUrl} style={styles.academyLogo} cache={false} />
            </View>
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>MCA</Text>
            </View>
          )}
        </View>
        <Text style={styles.academyNameLarge}>
          MADANI COMPUTER{'\n'}ACADEMY
        </Text>
      </View>

      {/* Content */}
      <View style={styles.backsideContent}>
        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <View style={styles.qrCodeContainer}>
            <PdfImage src={generateQRCodeUrl()} style={styles.qrCode} cache={false} />
          </View>
          <Text style={styles.qrLabel}>Scan for Location</Text>
        </View>

        <View style={styles.sectionDivider} />

        {/* Contact Information */}
        <View style={styles.contactSection}>
          {/* Address */}
          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>{Icons.location}</Text>
            <Text style={styles.contactLabel}>Address:</Text>
            <Text style={styles.addressText}>
              Sagayapuram, 4/1, 12th Cross Rd, opp. A1{'\n'}
              Function Hall, Richards Town, Bengaluru 560084
            </Text>
          </View>

          {/* Phone Numbers - Single Row */}
          <View style={styles.phoneRow}>
            <View style={styles.phoneItem}>
              <Text style={styles.contactIcon}>{Icons.phone}</Text>
              <Text style={styles.phoneLabel}>Ph 1:</Text>
              <Text style={styles.phoneNumber}>{academyPhone}</Text>
            </View>
            <View style={styles.phoneItem}>
              <Text style={styles.contactIcon}>{Icons.phone}</Text>
              <Text style={styles.phoneLabel}>Ph 2:</Text>
              <Text style={styles.phoneNumber}>+91 8453934523</Text>
            </View>
          </View>

          {/* Email and Website - Single Row */}
          <View style={styles.phoneRow}>
            <View style={styles.phoneItem}>
              <Text style={styles.phoneLabel}>Email:</Text>
              <Text style={styles.phoneNumber}>{academyEmail}</Text>
            </View>
            <View style={styles.phoneItem}>
              <Text style={styles.phoneLabel}>Web:</Text>
              <Text style={styles.phoneNumber}>{academyWebsite}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.backsideFooter}>
        <Text style={styles.footerText}>
          This card is property of Madani Computer Academy{'\n'}
          Valid for the academic session {new Date().getFullYear()}-{new Date().getFullYear() + 1}
        </Text>
      </View>
    </View>
  );
};

export const BulkStudentIDCardPDF: FC<BulkStudentIDCardPDFProps> = ({
  students,
  ceoSignatureUrl,
  courseDirectorSignatureUrl,
  academyLogoUrl,
  academyAddress = 'Sagayapuram, 4/1, 12th Cross Rd, opp. A1 Function Hall, next to Citizen School, Richards Town, Bengaluru, Karnataka 560084',
  academyPhone = '+91 9739481735',
  academyEmail = 'support@mca360.org',
  academyWebsite = 'www.mca360.org',
}) => {
  // Calculate how many cards fit per page (2 columns × 3 rows = 6 cards per page)
  const cardsPerPage = 6;

  // Split students into pages
  const frontPages: StudentListItem[][] = [];
  for (let i = 0; i < students.length; i += cardsPerPage) {
    frontPages.push(students.slice(i, i + cardsPerPage));
  }

  return (
    <Document>
      {/* Render all front cards */}
      {frontPages.map((pageStudents, pageIndex) => (
        <Page key={`front-page-${pageIndex}`} size="A4" style={styles.page}>
          {pageStudents.map((student, studentIndex) => (
            <View key={`front-${student._id}-${studentIndex}`} style={styles.cardWrapper}>
              <FrontCard
                student={student}
                ceoSignatureUrl={ceoSignatureUrl}
                courseDirectorSignatureUrl={courseDirectorSignatureUrl}
              />
            </View>
          ))}
        </Page>
      ))}

      {/* Render all back cards */}
      {frontPages.map((pageStudents, pageIndex) => (
        <Page key={`back-page-${pageIndex}`} size="A4" style={styles.page}>
          {pageStudents.map((student, studentIndex) => (
            <View key={`back-${student._id}-${studentIndex}`} style={styles.cardWrapper}>
              <BackCard
                academyLogoUrl={academyLogoUrl}
                academyAddress={academyAddress}
                academyPhone={academyPhone}
                academyEmail={academyEmail}
                academyWebsite={academyWebsite}
              />
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
};

