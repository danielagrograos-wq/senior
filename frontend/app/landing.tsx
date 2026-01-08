import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Theme colors
const colors = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#14B8A6',
  secondary: '#F59E0B',
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
  textMuted: '#94A3B8',
  success: '#10B981',
  error: '#EF4444',
  info: '#3B82F6',
};

// Responsive hook
const useResponsive = () => {
  const { width } = useWindowDimensions();
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
};

// Animated Phone Component
const AnimatedPhone = ({ isMobile }: { isMobile: boolean }) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const screens = [
    { title: 'Encontre Cuidadores', icon: 'search', color: colors.primary, desc: 'Busque profissionais verificados' },
    { title: 'Smart Match', icon: 'heart', color: colors.error, desc: '94% de compatibilidade' },
    { title: 'Chat Seguro', icon: 'chatbubbles', color: colors.primaryLight, desc: 'Converse diretamente' },
    { title: 'Agende Fácil', icon: 'calendar', color: colors.secondary, desc: 'Marque horários' },
    { title: 'Care Log', icon: 'document-text', color: colors.success, desc: 'Acompanhe o cuidado' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      
      setTimeout(() => {
        setCurrentScreen((prev) => (prev + 1) % screens.length);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const phoneSize = isMobile ? { width: 200, height: 400 } : { width: 280, height: 560 };

  return (
    <View style={[styles.phoneContainer, isMobile && { marginTop: 30 }]}>
      <View style={[styles.phone, phoneSize]}>
        <View style={styles.phoneNotch} />
        <Animated.View style={[styles.phoneScreen, { opacity: fadeAnim }]}>
          <View style={[styles.screenIcon, { backgroundColor: screens[currentScreen].color + '20' }]}>
            <Ionicons name={screens[currentScreen].icon as any} size={isMobile ? 36 : 48} color={screens[currentScreen].color} />
          </View>
          <Text style={[styles.screenTitle, isMobile && { fontSize: 18 }]}>{screens[currentScreen].title}</Text>
          <Text style={[styles.screenDesc, isMobile && { fontSize: 12 }]}>{screens[currentScreen].desc}</Text>
          <View style={styles.screenDots}>
            {screens.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentScreen && styles.dotActive]} />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description, color, isMobile }: any) => (
  <View style={[styles.featureCard, isMobile && styles.featureCardMobile]}>
    <View style={[styles.featureIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={isMobile ? 24 : 32} color={color} />
    </View>
    <Text style={[styles.featureTitle, isMobile && { fontSize: 14 }]}>{title}</Text>
    <Text style={[styles.featureDesc, isMobile && { fontSize: 12 }]}>{description}</Text>
  </View>
);

// Testimonial Component
const TestimonialCard = ({ name, role, text, avatar, isMobile }: any) => (
  <View style={[styles.testimonialCard, isMobile && { width: 260 }]}>
    <View style={styles.testimonialHeader}>
      <View style={styles.testimonialAvatar}>
        <Text style={styles.avatarText}>{avatar}</Text>
      </View>
      <View>
        <Text style={styles.testimonialName}>{name}</Text>
        <Text style={styles.testimonialRole}>{role}</Text>
      </View>
    </View>
    <Text style={styles.testimonialText}>"{text}"</Text>
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name="star" size={16} color={colors.secondary} />
      ))}
    </View>
  </View>
);

// How It Works Step Component
const HowItWorksStep = ({ step, isMobile, isLast }: any) => (
  <View style={styles.stepItem}>
    <View style={styles.stepLeft}>
      <View style={[styles.stepCircle, { backgroundColor: step.color }]}>
        <Ionicons name={step.icon} size={isMobile ? 20 : 28} color={colors.white} />
      </View>
      {!isLast && <View style={styles.stepLine} />}
    </View>
    <View style={[styles.stepRight, isMobile && { paddingRight: 10 }]}>
      <View style={[styles.stepBadge, { backgroundColor: step.color + '20' }]}>
        <Text style={[styles.stepBadgeText, { color: step.color }]}>Passo {step.number}</Text>
      </View>
      <Text style={[styles.stepTitle, isMobile && { fontSize: 16 }]}>{step.title}</Text>
      <Text style={[styles.stepDesc, isMobile && { fontSize: 13 }]}>{step.description}</Text>
      
      {/* Visual Card */}
      <View style={[styles.stepVisual, { borderColor: step.color + '30' }]}>
        <View style={[styles.stepVisualIcon, { backgroundColor: step.color + '15' }]}>
          <Ionicons name={step.icon} size={isMobile ? 24 : 32} color={step.color} />
        </View>
        <View style={styles.stepVisualLines}>
          <View style={[styles.stepVisualLine, { backgroundColor: step.color + '40', width: '80%' }]} />
          <View style={[styles.stepVisualLine, { backgroundColor: step.color + '30', width: '60%' }]} />
          <View style={[styles.stepVisualLine, { backgroundColor: step.color + '20', width: '45%' }]} />
        </View>
      </View>
    </View>
  </View>
);

// Admin Video Section (only visible to admin)
const AdminVideoSection = ({ isAdmin }: { isAdmin: boolean }) => {
  if (!isAdmin) return null;
  
  return (
    <View style={styles.adminSection}>
      <View style={styles.adminBadge}>
        <Ionicons name="shield" size={14} color={colors.white} />
        <Text style={styles.adminBadgeText}>Área Admin</Text>
      </View>
      <Text style={styles.adminTitle}>🎬 Configurar Vídeo</Text>
      <Text style={styles.adminDesc}>
        Cole URL do YouTube/Vimeo para exibir vídeo promocional.
      </Text>
      <View style={styles.adminInputRow}>
        <View style={styles.adminInput}>
          <Ionicons name="link" size={18} color={colors.textMuted} />
          <Text style={styles.adminPlaceholder}>URL do vídeo...</Text>
        </View>
        <TouchableOpacity style={styles.adminBtn}>
          <Text style={styles.adminBtnText}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const handleGetStarted = () => {
    router.push('/(auth)/register');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const steps = [
    { number: '1', title: 'Crie sua Conta', description: 'Cadastre-se gratuitamente em menos de 2 minutos como família ou cuidador.', icon: 'person-add', color: colors.primary },
    { number: '2', title: 'Complete seu Perfil', description: 'Informe necessidades do idoso ou suas especialidades como cuidador.', icon: 'clipboard', color: colors.secondary },
    { number: '3', title: 'Encontre o Match', description: 'Nossa IA sugere os profissionais mais compatíveis com suas necessidades.', icon: 'heart', color: colors.error },
    { number: '4', title: 'Converse pelo Chat', description: 'Use nosso chat seguro para conhecer o cuidador antes de contratar.', icon: 'chatbubbles', color: colors.info },
    { number: '5', title: 'Agende e Pague', description: 'Escolha horários e pague com segurança através do sistema de escrow.', icon: 'calendar', color: colors.primaryDark },
    { number: '6', title: 'Acompanhe Tudo', description: 'Receba atualizações em tempo real pelo Care Log do seu familiar.', icon: 'eye', color: colors.success },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={[styles.header, isMobile && styles.headerMobile]}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, isMobile && { width: 36, height: 36 }]}>
              <Ionicons name="home" size={isMobile ? 18 : 24} color={colors.white} />
            </View>
            <Text style={[styles.logoText, isMobile && { fontSize: 18 }]}>
              Senior<Text style={styles.logoTextBold}>Care</Text><Text style={styles.logoPlus}>+</Text>
            </Text>
          </View>
          <TouchableOpacity style={[styles.loginButton, isMobile && styles.loginButtonMobile]} onPress={handleLogin}>
            <Text style={[styles.loginButtonText, isMobile && { fontSize: 13 }]}>Entrar</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={[styles.hero, isMobile && styles.heroMobile]}>
          <View style={[styles.heroContent, isMobile && styles.heroContentMobile]}>
            <Text style={[styles.heroTag, isMobile && { fontSize: 12 }]}>🏆 #1 App de Cuidadores do Brasil</Text>
            <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
              Cuidado que{'\n'}
              <Text style={styles.heroHighlight}>conecta</Text> famílias
            </Text>
            <Text style={[styles.heroSubtitle, isMobile && { fontSize: 15 }]}>
              Encontre cuidadores verificados para seus pais e avós. 
              Segurança, confiança e carinho em um único app.
            </Text>
            
            <View style={[styles.heroButtons, isMobile && styles.heroButtonsMobile]}>
              <TouchableOpacity style={[styles.primaryButton, isMobile && styles.primaryButtonMobile]} onPress={handleGetStarted}>
                <Text style={styles.primaryButtonText}>Começar Agora</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={[styles.heroStats, isMobile && styles.heroStatsMobile]}>
              <View style={styles.stat}>
                <Text style={[styles.statNumber, isMobile && { fontSize: 22 }]}>5.000+</Text>
                <Text style={[styles.statLabel, isMobile && { fontSize: 10 }]}>Famílias</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={[styles.statNumber, isMobile && { fontSize: 22 }]}>1.200+</Text>
                <Text style={[styles.statLabel, isMobile && { fontSize: 10 }]}>Cuidadores</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={[styles.statNumber, isMobile && { fontSize: 22 }]}>4.9★</Text>
                <Text style={[styles.statLabel, isMobile && { fontSize: 10 }]}>Avaliação</Text>
              </View>
            </View>
          </View>

          <AnimatedPhone isMobile={isMobile} />
        </View>

        {/* How It Works Section */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, isMobile && { fontSize: 22 }]}>📱 Veja Como Funciona</Text>
          <Text style={[styles.sectionSubtitle, isMobile && { fontSize: 14, paddingHorizontal: 10 }]}>
            Em 6 passos simples, encontre o cuidador ideal
          </Text>
          
          <View style={[styles.stepsContainer, isMobile && { paddingHorizontal: 16 }]}>
            {steps.map((step, index) => (
              <HowItWorksStep 
                key={index} 
                step={step} 
                isMobile={isMobile}
                isLast={index === steps.length - 1}
              />
            ))}
          </View>

          {/* Quick Stats */}
          <View style={[styles.quickStats, isMobile && styles.quickStatsMobile]}>
            <View style={styles.quickStatItem}>
              <Ionicons name="time-outline" size={28} color={colors.primary} />
              <Text style={styles.quickStatNumber}>2 min</Text>
              <Text style={styles.quickStatLabel}>para cadastrar</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Ionicons name="flash-outline" size={28} color={colors.secondary} />
              <Text style={styles.quickStatNumber}>24h</Text>
              <Text style={styles.quickStatLabel}>para encontrar</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Ionicons name="shield-checkmark-outline" size={28} color={colors.success} />
              <Text style={styles.quickStatNumber}>100%</Text>
              <Text style={styles.quickStatLabel}>verificados</Text>
            </View>
          </View>
        </View>

        {/* Admin Video Section (hidden from users) */}
        <AdminVideoSection isAdmin={false} />

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isMobile && { fontSize: 22 }]}>✨ Por que escolher o SeniorCare+?</Text>
          <Text style={[styles.sectionSubtitle, isMobile && { fontSize: 14 }]}>
            Tecnologia e humanidade para cuidar de quem você ama
          </Text>
          
          <View style={[styles.featuresGrid, isMobile && styles.featuresGridMobile]}>
            <FeatureCard icon="shield-checkmark" title="100% Verificados" description="Verificação rigorosa de documentos e antecedentes" color={colors.success} isMobile={isMobile} />
            <FeatureCard icon="heart" title="Smart Match" description="IA encontra o cuidador ideal para você" color={colors.error} isMobile={isMobile} />
            <FeatureCard icon="chatbubbles" title="Chat Seguro" description="Comunicação direta dentro do app" color={colors.primary} isMobile={isMobile} />
            <FeatureCard icon="document-text" title="Care Log" description="Registro diário de atividades" color={colors.secondary} isMobile={isMobile} />
            <FeatureCard icon="card" title="Pagamento Seguro" description="Sistema de escrow protege você" color={colors.primaryDark} isMobile={isMobile} />
            <FeatureCard icon="warning" title="Botão SOS" description="Emergência com um toque" color={colors.error} isMobile={isMobile} />
          </View>
        </View>

        {/* Testimonials */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <Text style={[styles.sectionTitle, isMobile && { fontSize: 22 }]}>💬 O que dizem sobre nós</Text>
          <Text style={[styles.sectionSubtitle, isMobile && { fontSize: 14 }]}>
            Histórias reais de famílias e cuidadores
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testimonialScroll} contentContainerStyle={{ paddingHorizontal: 20 }}>
            <TestimonialCard name="Maria Helena" role="Filha, São Paulo" text="Encontrei a cuidadora perfeita para minha mãe em menos de uma semana!" avatar="MH" isMobile={isMobile} />
            <TestimonialCard name="Carlos Santos" role="Cuidador, Campo Grande" text="Minha renda aumentou 50% com o SeniorCare+. Recomendo!" avatar="CS" isMobile={isMobile} />
            <TestimonialCard name="Ana Paula" role="Filha, Curitiba" text="A verificação dos cuidadores me deu muita segurança." avatar="AP" isMobile={isMobile} />
          </ScrollView>
        </View>

        {/* Senior Mode */}
        <View style={styles.section}>
          <View style={[styles.seniorModeCard, isMobile && { padding: 20 }]}>
            <View style={styles.seniorModeIcon}>
              <Ionicons name="accessibility" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.seniorModeTitle, isMobile && { fontSize: 20 }]}>♿ Modo Sênior</Text>
            <Text style={[styles.seniorModeText, isMobile && { fontSize: 14 }]}>
              Interface simplificada com fontes maiores para idosos usarem com autonomia.
            </Text>
            <View style={[styles.seniorFeatures, isMobile && { flexDirection: 'column', gap: 8 }]}>
              <View style={styles.seniorFeature}>
                <Ionicons name="text" size={18} color={colors.primary} />
                <Text style={styles.seniorFeatureText}>Fontes 50% maiores</Text>
              </View>
              <View style={styles.seniorFeature}>
                <Ionicons name="contrast" size={18} color={colors.primary} />
                <Text style={styles.seniorFeatureText}>Alto contraste</Text>
              </View>
              <View style={styles.seniorFeature}>
                <Ionicons name="finger-print" size={18} color={colors.primary} />
                <Text style={styles.seniorFeatureText}>Botões maiores</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Final CTA */}
        <View style={[styles.finalCTA, isMobile && { marginHorizontal: 16 }]}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={[styles.ctaGradient, isMobile && { padding: 24 }]}>
            <Text style={[styles.ctaTitle, isMobile && { fontSize: 24 }]}>Pronto para começar?</Text>
            <Text style={[styles.ctaSubtitle, isMobile && { fontSize: 14 }]}>
              Junte-se a milhares de famílias que encontraram o cuidador ideal
            </Text>
            
            <View style={[styles.ctaButtons, isMobile && { flexDirection: 'column' }]}>
              <TouchableOpacity style={styles.ctaButtonPrimary} onPress={handleGetStarted}>
                <Ionicons name="person-add" size={22} color={colors.primary} />
                <Text style={styles.ctaButtonPrimaryText}>Sou Família</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctaButtonSecondary} onPress={handleGetStarted}>
                <Ionicons name="medkit" size={22} color={colors.white} />
                <Text style={styles.ctaButtonSecondaryText}>Sou Cuidador</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.downloadBadges, isMobile && { flexDirection: 'column' }]}>
              <TouchableOpacity style={styles.badge}>
                <Ionicons name="logo-apple" size={22} color={colors.white} />
                <View>
                  <Text style={styles.badgeSmall}>Baixar na</Text>
                  <Text style={styles.badgeLarge}>App Store</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.badge}>
                <Ionicons name="logo-google-playstore" size={22} color={colors.white} />
                <View>
                  <Text style={styles.badgeSmall}>Disponível no</Text>
                  <Text style={styles.badgeLarge}>Google Play</Text>
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={[styles.footer, isMobile && { padding: 24 }]}>
          <View style={styles.footerLogo}>
            <View style={[styles.logoIcon, { width: 32, height: 32 }]}>
              <Ionicons name="home" size={16} color={colors.white} />
            </View>
            <Text style={styles.footerLogoText}>SeniorCare+</Text>
          </View>
          <Text style={styles.footerTagline}>Cuidado que conecta</Text>
          
          <View style={[styles.footerLinks, isMobile && { gap: 16 }]}>
            <TouchableOpacity><Text style={styles.footerLink}>Sobre</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.footerLink}>Termos</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.footerLink}>Privacidade</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.footerLink}>Contato</Text></TouchableOpacity>
          </View>
          
          <View style={styles.socialLinks}>
            <TouchableOpacity style={styles.socialIcon}><Ionicons name="logo-instagram" size={22} color={colors.textMuted} /></TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}><Ionicons name="logo-facebook" size={22} color={colors.textMuted} /></TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}><Ionicons name="logo-linkedin" size={22} color={colors.textMuted} /></TouchableOpacity>
          </View>
          
          <Text style={styles.copyright}>© 2025 SeniorCare+. Todos os direitos reservados.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerMobile: { paddingHorizontal: 16, paddingVertical: 12 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 22, color: colors.primary },
  logoTextBold: { fontWeight: 'bold' },
  logoPlus: { color: colors.secondary, fontWeight: 'bold' },
  loginButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.primary },
  loginButtonMobile: { paddingHorizontal: 14, paddingVertical: 8 },
  loginButtonText: { color: colors.primary, fontWeight: '600' },

  // Hero
  hero: { flexDirection: 'row', padding: 40, paddingBottom: 60, backgroundColor: colors.white, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  heroMobile: { flexDirection: 'column', padding: 20, paddingTop: 24 },
  heroContent: { flex: 1, maxWidth: 550, paddingRight: 40 },
  heroContentMobile: { paddingRight: 0, maxWidth: '100%' },
  heroTag: { fontSize: 14, color: colors.primary, fontWeight: '600', backgroundColor: colors.primary + '10', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  heroTitle: { fontSize: 44, fontWeight: 'bold', color: colors.text, lineHeight: 54, marginBottom: 16 },
  heroTitleMobile: { fontSize: 28, lineHeight: 36 },
  heroHighlight: { color: colors.primary },
  heroSubtitle: { fontSize: 17, color: colors.textLight, lineHeight: 26, marginBottom: 28 },
  heroButtons: { flexDirection: 'row', gap: 16, marginBottom: 36 },
  heroButtonsMobile: { flexDirection: 'column', gap: 12 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, gap: 8 },
  primaryButtonMobile: { justifyContent: 'center' },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  heroStatsMobile: { gap: 16, justifyContent: 'center' },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 26, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#E2E8F0' },

  // Phone
  phoneContainer: { alignItems: 'center' },
  phone: { backgroundColor: colors.text, borderRadius: 36, padding: 10 },
  phoneNotch: { width: 100, height: 24, backgroundColor: colors.text, borderRadius: 16, alignSelf: 'center', marginBottom: 6 },
  phoneScreen: { flex: 1, backgroundColor: colors.white, borderRadius: 26, justifyContent: 'center', alignItems: 'center', padding: 16 },
  screenIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  screenTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 6 },
  screenDesc: { fontSize: 14, color: colors.textLight, textAlign: 'center' },
  screenDots: { flexDirection: 'row', gap: 6, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  dotActive: { backgroundColor: colors.primary, width: 20 },

  // Sections
  section: { padding: 40, paddingVertical: 50 },
  sectionTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 10 },
  sectionSubtitle: { fontSize: 16, color: colors.textLight, textAlign: 'center', marginBottom: 36 },

  // Steps
  stepsContainer: { maxWidth: 600, alignSelf: 'center', width: '100%' },
  stepItem: { flexDirection: 'row', marginBottom: 12 },
  stepLeft: { alignItems: 'center', marginRight: 16 },
  stepCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  stepLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
  stepRight: { flex: 1, paddingBottom: 24 },
  stepBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  stepBadgeText: { fontSize: 12, fontWeight: '600' },
  stepTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 6 },
  stepDesc: { fontSize: 14, color: colors.textLight, lineHeight: 22, marginBottom: 12 },
  stepVisual: { backgroundColor: colors.white, borderRadius: 12, padding: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepVisualIcon: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stepVisualLines: { flex: 1, gap: 8 },
  stepVisualLine: { height: 8, borderRadius: 4 },

  // Quick Stats
  quickStats: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginTop: 40, flexWrap: 'wrap' },
  quickStatsMobile: { gap: 20 },
  quickStatItem: { alignItems: 'center', backgroundColor: colors.white, padding: 20, borderRadius: 16, minWidth: 100 },
  quickStatNumber: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 8 },
  quickStatLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },

  // Features
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  featuresGridMobile: { gap: 12 },
  featureCard: { width: 300, backgroundColor: colors.white, borderRadius: 16, padding: 20 },
  featureCardMobile: { width: '100%' },
  featureIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  featureTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
  featureDesc: { fontSize: 13, color: colors.textLight, lineHeight: 20 },

  // Testimonials
  testimonialScroll: { marginHorizontal: -20 },
  testimonialCard: { width: 300, backgroundColor: colors.background, borderRadius: 16, padding: 20, marginRight: 16 },
  testimonialHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  testimonialAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  testimonialName: { fontSize: 15, fontWeight: '600', color: colors.text },
  testimonialRole: { fontSize: 12, color: colors.textMuted },
  testimonialText: { fontSize: 14, color: colors.textLight, fontStyle: 'italic', lineHeight: 22, marginBottom: 10 },
  stars: { flexDirection: 'row', gap: 3 },

  // Senior Mode
  seniorModeCard: { backgroundColor: colors.white, borderRadius: 20, padding: 32, alignItems: 'center', maxWidth: 480, alignSelf: 'center' },
  seniorModeIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  seniorModeTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  seniorModeText: { fontSize: 15, color: colors.textLight, textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  seniorFeatures: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  seniorFeature: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '10', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  seniorFeatureText: { fontSize: 13, color: colors.primary, fontWeight: '500' },

  // Final CTA
  finalCTA: { marginHorizontal: 20, marginVertical: 40, borderRadius: 24, overflow: 'hidden' },
  ctaGradient: { padding: 40, alignItems: 'center' },
  ctaTitle: { fontSize: 30, fontWeight: 'bold', color: colors.white, marginBottom: 10, textAlign: 'center' },
  ctaSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 28 },
  ctaButtons: { flexDirection: 'row', gap: 14, marginBottom: 28 },
  ctaButtonPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 12, gap: 8 },
  ctaButtonPrimaryText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  ctaButtonSecondary: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 12, gap: 8 },
  ctaButtonSecondaryText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  downloadBadges: { flexDirection: 'row', gap: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, gap: 10 },
  badgeSmall: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  badgeLarge: { fontSize: 14, fontWeight: '600', color: colors.white },

  // Admin Section
  adminSection: { backgroundColor: colors.text, margin: 20, padding: 20, borderRadius: 16 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.error, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  adminBadgeText: { color: colors.white, fontSize: 11, fontWeight: '600' },
  adminTitle: { fontSize: 18, fontWeight: '600', color: colors.white, marginBottom: 8 },
  adminDesc: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  adminInputRow: { flexDirection: 'row', gap: 10 },
  adminInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  adminPlaceholder: { color: colors.textMuted, fontSize: 13 },
  adminBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  adminBtnText: { color: colors.white, fontWeight: '600', fontSize: 13 },

  // Footer
  footer: { backgroundColor: colors.text, padding: 40, alignItems: 'center' },
  footerLogo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  footerLogoText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  footerTagline: { color: colors.textMuted, fontSize: 13, marginBottom: 20 },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 24, marginBottom: 20 },
  footerLink: { color: '#94A3B8', fontSize: 13 },
  socialLinks: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  socialIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  copyright: { color: colors.textMuted, fontSize: 11 },
});
