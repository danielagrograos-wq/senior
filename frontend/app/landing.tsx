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
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

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
};

// Animated Phone Component showing app screens
const AnimatedPhone = () => {
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

  return (
    <View style={styles.phoneContainer}>
      <View style={styles.phone}>
        <View style={styles.phoneNotch} />
        <Animated.View style={[styles.phoneScreen, { opacity: fadeAnim }]}>
          <View style={[styles.screenIcon, { backgroundColor: screens[currentScreen].color + '20' }]}>
            <Ionicons name={screens[currentScreen].icon as any} size={48} color={screens[currentScreen].color} />
          </View>
          <Text style={styles.screenTitle}>{screens[currentScreen].title}</Text>
          <Text style={styles.screenDesc}>{screens[currentScreen].desc}</Text>
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
const FeatureCard = ({ icon, title, description, color, delay }: any) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, delay, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, delay, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.featureCard, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <View style={[styles.featureIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{description}</Text>
    </Animated.View>
  );
};

// Step Component for How it Works
const StepCard = ({ number, title, description, icon, isCaregiver }: any) => (
  <View style={styles.stepCard}>
    <View style={[styles.stepNumber, { backgroundColor: isCaregiver ? colors.primary : colors.secondary }]}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Ionicons name={icon} size={24} color={isCaregiver ? colors.primary : colors.secondary} />
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      <Text style={styles.stepDesc}>{description}</Text>
    </View>
  </View>
);

// Testimonial Component
const TestimonialCard = ({ name, role, text, avatar }: any) => (
  <View style={styles.testimonialCard}>
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

// Video Section Component
const VideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  return (
    <View style={styles.videoSection}>
      <Text style={styles.sectionTitle}>🎬 Veja Como Funciona</Text>
      <Text style={styles.sectionSubtitle}>Assista ao vídeo e descubra como o SeniorCare+ pode ajudar sua família</Text>
      
      <View style={styles.videoContainer}>
        {!isPlaying ? (
          <TouchableOpacity style={styles.videoPlaceholder} onPress={() => setIsPlaying(true)}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.videoGradient}
            >
              <View style={styles.playButton}>
                <Ionicons name="play" size={48} color={colors.white} />
              </View>
              <Text style={styles.videoPlayText}>Assistir Vídeo Demo</Text>
              <Text style={styles.videoDuration}>2:30 min</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.videoPlayer}>
            {/* Animated Demo Content */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.demoScroll}>
              <View style={styles.demoSlide}>
                <Ionicons name="person-add" size={64} color={colors.primary} />
                <Text style={styles.demoTitle}>1. Cadastre-se</Text>
                <Text style={styles.demoText}>Crie sua conta como família ou cuidador em menos de 2 minutos</Text>
              </View>
              <View style={styles.demoSlide}>
                <Ionicons name="search" size={64} color={colors.primary} />
                <Text style={styles.demoTitle}>2. Busque</Text>
                <Text style={styles.demoText}>Encontre cuidadores verificados na sua região</Text>
              </View>
              <View style={styles.demoSlide}>
                <Ionicons name="heart" size={64} color={colors.error} />
                <Text style={styles.demoTitle}>3. Match Inteligente</Text>
                <Text style={styles.demoText}>Nossa IA encontra o profissional ideal para você</Text>
              </View>
              <View style={styles.demoSlide}>
                <Ionicons name="chatbubbles" size={64} color={colors.primaryLight} />
                <Text style={styles.demoTitle}>4. Converse</Text>
                <Text style={styles.demoText}>Chat seguro para conhecer o cuidador</Text>
              </View>
              <View style={styles.demoSlide}>
                <Ionicons name="calendar" size={64} color={colors.secondary} />
                <Text style={styles.demoTitle}>5. Agende</Text>
                <Text style={styles.demoText}>Marque horários direto pelo app</Text>
              </View>
              <View style={styles.demoSlide}>
                <Ionicons name="shield-checkmark" size={64} color={colors.success} />
                <Text style={styles.demoTitle}>6. Cuide com Confiança</Text>
                <Text style={styles.demoText}>Acompanhe tudo em tempo real</Text>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.closeVideo} onPress={() => setIsPlaying(false)}>
              <Text style={styles.closeVideoText}>Fechar Demonstração</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleGetStarted = () => {
    router.push('/(auth)/register');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="home" size={24} color={colors.white} />
            </View>
            <Text style={styles.logoText}>Senior<Text style={styles.logoTextBold}>Care</Text><Text style={styles.logoPlus}>+</Text></Text>
          </View>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTag}>🏆 #1 App de Cuidadores do Brasil</Text>
            <Text style={styles.heroTitle}>
              Cuidado que{'\n'}
              <Text style={styles.heroHighlight}>conecta</Text> famílias
            </Text>
            <Text style={styles.heroSubtitle}>
              Encontre cuidadores verificados para seus pais e avós. 
              Segurança, confiança e carinho em um único app.
            </Text>
            
            <View style={styles.heroButtons}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
                <Text style={styles.primaryButtonText}>Começar Agora</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL('#video')}>
                <Ionicons name="play-circle" size={24} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Ver Demo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroStats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>5.000+</Text>
                <Text style={styles.statLabel}>Famílias Atendidas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>1.200+</Text>
                <Text style={styles.statLabel}>Cuidadores Verificados</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>4.9★</Text>
                <Text style={styles.statLabel}>Avaliação Média</Text>
              </View>
            </View>
          </View>

          <AnimatedPhone />
        </View>

        {/* Video Demo Section */}
        <VideoSection />

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Por que escolher o SeniorCare+?</Text>
          <Text style={styles.sectionSubtitle}>Tecnologia e humanidade juntas para cuidar de quem você ama</Text>
          
          <View style={styles.featuresGrid}>
            <FeatureCard
              icon="shield-checkmark"
              title="100% Verificados"
              description="Todos os cuidadores passam por verificação rigorosa de documentos e antecedentes"
              color={colors.success}
              delay={0}
            />
            <FeatureCard
              icon="heart"
              title="Smart Match"
              description="Algoritmo inteligente que encontra o cuidador ideal para as necessidades específicas"
              color={colors.error}
              delay={100}
            />
            <FeatureCard
              icon="chatbubbles"
              title="Chat Integrado"
              description="Comunicação direta e segura entre família e cuidador dentro do app"
              color={colors.primary}
              delay={200}
            />
            <FeatureCard
              icon="document-text"
              title="Care Log"
              description="Registro diário de atividades: medicamentos, refeições, humor e muito mais"
              color={colors.secondary}
              delay={300}
            />
            <FeatureCard
              icon="card"
              title="Pagamento Seguro"
              description="Sistema de escrow protege seu dinheiro até o serviço ser confirmado"
              color={colors.primaryDark}
              delay={400}
            />
            <FeatureCard
              icon="warning"
              title="Botão SOS"
              description="Em emergências, acione família e serviços de emergência com um toque"
              color={colors.error}
              delay={500}
            />
          </View>
        </View>

        {/* How it Works - Families */}
        <View style={[styles.section, styles.sectionAlt]}>
          <Text style={styles.sectionTitle}>👨‍👩‍👧 Para Famílias</Text>
          <Text style={styles.sectionSubtitle}>Encontrar um cuidador de confiança nunca foi tão fácil</Text>
          
          <View style={styles.stepsContainer}>
            <StepCard
              number="1"
              title="Crie seu perfil"
              description="Cadastre informações sobre o idoso: necessidades, preferências e rotina"
              icon="person-add"
              isCaregiver={false}
            />
            <StepCard
              number="2"
              title="Receba sugestões"
              description="Nossa IA analisa e sugere os cuidadores mais compatíveis"
              icon="sparkles"
              isCaregiver={false}
            />
            <StepCard
              number="3"
              title="Converse e agende"
              description="Conheça o cuidador pelo chat e marque uma visita"
              icon="calendar"
              isCaregiver={false}
            />
            <StepCard
              number="4"
              title="Acompanhe em tempo real"
              description="Receba atualizações do Care Log e fique tranquilo"
              icon="eye"
              isCaregiver={false}
            />
          </View>
        </View>

        {/* How it Works - Caregivers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👩‍⚕️ Para Cuidadores</Text>
          <Text style={styles.sectionSubtitle}>Expanda sua carreira e encontre mais oportunidades</Text>
          
          <View style={styles.stepsContainer}>
            <StepCard
              number="1"
              title="Cadastre-se gratuitamente"
              description="Crie seu perfil profissional com suas especialidades e experiência"
              icon="person-add"
              isCaregiver={true}
            />
            <StepCard
              number="2"
              title="Seja verificado"
              description="Envie seus documentos e receba o selo de cuidador verificado"
              icon="shield-checkmark"
              isCaregiver={true}
            />
            <StepCard
              number="3"
              title="Receba oportunidades"
              description="Famílias compatíveis com seu perfil entrarão em contato"
              icon="notifications"
              isCaregiver={true}
            />
            <StepCard
              number="4"
              title="Construa sua reputação"
              description="Receba avaliações e aumente sua visibilidade na plataforma"
              icon="star"
              isCaregiver={true}
            />
          </View>

          <View style={styles.caregiverCTA}>
            <Text style={styles.caregiverCTATitle}>🎓 SeniorCare Academy</Text>
            <Text style={styles.caregiverCTAText}>
              Acesse cursos gratuitos e aprimore suas habilidades. Cuidadores certificados ganham até 40% mais!
            </Text>
            <TouchableOpacity style={styles.caregiverCTAButton}>
              <Text style={styles.caregiverCTAButtonText}>Conhecer a Academy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Testimonials */}
        <View style={[styles.section, styles.sectionAlt]}>
          <Text style={styles.sectionTitle}>💬 O que dizem sobre nós</Text>
          <Text style={styles.sectionSubtitle}>Histórias reais de famílias e cuidadores</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testimonialScroll}>
            <TestimonialCard
              name="Maria Helena"
              role="Filha de usuária, São Paulo"
              text="Encontrei a cuidadora perfeita para minha mãe em menos de uma semana. O Care Log me deixa tranquila mesmo morando longe."
              avatar="MH"
            />
            <TestimonialCard
              name="Carlos Santos"
              role="Cuidador, Campo Grande"
              text="Minha renda aumentou 50% depois que entrei no SeniorCare+. Os cursos da Academy me ajudaram muito a me destacar."
              avatar="CS"
            />
            <TestimonialCard
              name="Ana Paula"
              role="Filha de usuário, Curitiba"
              text="A verificação dos cuidadores me deu muita segurança. Recomendo para todas as famílias que precisam de apoio."
              avatar="AP"
            />
            <TestimonialCard
              name="Fernanda Lima"
              role="Cuidadora, Fortaleza"
              text="O app é muito fácil de usar e o pagamento sempre cai certinho. Finalmente uma plataforma que valoriza nosso trabalho!"
              avatar="FL"
            />
          </ScrollView>
        </View>

        {/* Senior Mode Section */}
        <View style={styles.section}>
          <View style={styles.seniorModeCard}>
            <View style={styles.seniorModeIcon}>
              <Ionicons name="accessibility" size={48} color={colors.primary} />
            </View>
            <Text style={styles.seniorModeTitle}>♿ Modo Sênior</Text>
            <Text style={styles.seniorModeText}>
              Interface simplificada com fontes maiores e contraste alto.
              Pensado especialmente para idosos que querem usar o app com autonomia.
            </Text>
            <View style={styles.seniorModeFeatures}>
              <View style={styles.seniorFeature}>
                <Ionicons name="text" size={20} color={colors.primary} />
                <Text style={styles.seniorFeatureText}>Fontes 50% maiores</Text>
              </View>
              <View style={styles.seniorFeature}>
                <Ionicons name="contrast" size={20} color={colors.primary} />
                <Text style={styles.seniorFeatureText}>Alto contraste</Text>
              </View>
              <View style={styles.seniorFeature}>
                <Ionicons name="finger-print" size={20} color={colors.primary} />
                <Text style={styles.seniorFeatureText}>Botões maiores</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Final CTA */}
        <View style={styles.finalCTA}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.ctaGradient}>
            <Text style={styles.ctaTitle}>Pronto para começar?</Text>
            <Text style={styles.ctaSubtitle}>
              Junte-se a milhares de famílias que já encontraram o cuidador ideal
            </Text>
            
            <View style={styles.ctaButtons}>
              <TouchableOpacity style={styles.ctaButtonPrimary} onPress={handleGetStarted}>
                <Ionicons name="person-add" size={24} color={colors.primary} />
                <Text style={styles.ctaButtonPrimaryText}>Sou Família</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctaButtonSecondary} onPress={handleGetStarted}>
                <Ionicons name="medkit" size={24} color={colors.white} />
                <Text style={styles.ctaButtonSecondaryText}>Sou Cuidador</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.downloadBadges}>
              <TouchableOpacity style={styles.badge}>
                <Ionicons name="logo-apple" size={24} color={colors.white} />
                <View>
                  <Text style={styles.badgeSmall}>Baixar na</Text>
                  <Text style={styles.badgeLarge}>App Store</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.badge}>
                <Ionicons name="logo-google-playstore" size={24} color={colors.white} />
                <View>
                  <Text style={styles.badgeSmall}>Disponível no</Text>
                  <Text style={styles.badgeLarge}>Google Play</Text>
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <View style={styles.logoIcon}>
              <Ionicons name="home" size={20} color={colors.white} />
            </View>
            <Text style={styles.footerLogoText}>SeniorCare+</Text>
          </View>
          <Text style={styles.footerTagline}>Cuidado que conecta</Text>
          
          <View style={styles.footerLinks}>
            <TouchableOpacity><Text style={styles.footerLink}>Sobre Nós</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.footerLink}>Termos de Uso</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.footerLink}>Privacidade</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.footerLink}>Contato</Text></TouchableOpacity>
          </View>
          
          <View style={styles.socialLinks}>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-instagram" size={24} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-facebook" size={24} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-linkedin" size={24} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-youtube" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.copyright}>© 2025 SeniorCare+. Todos os direitos reservados.</Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    color: colors.primary,
  },
  logoTextBold: {
    fontWeight: 'bold',
  },
  logoPlus: {
    color: colors.secondary,
    fontWeight: 'bold',
  },
  loginButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  loginButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Hero Section
  hero: {
    flexDirection: isWeb ? 'row' : 'column',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 60,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
    maxWidth: isWeb ? 600 : '100%',
    paddingRight: isWeb ? 40 : 0,
  },
  heroTag: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 16,
    backgroundColor: colors.primary + '10',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroTitle: {
    fontSize: isWeb ? 48 : 36,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: isWeb ? 58 : 44,
    marginBottom: 16,
  },
  heroHighlight: {
    color: colors.primary,
  },
  heroSubtitle: {
    fontSize: 18,
    color: colors.textLight,
    lineHeight: 28,
    marginBottom: 32,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
    flexWrap: 'wrap',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },

  // Animated Phone
  phoneContainer: {
    alignItems: 'center',
    marginTop: isWeb ? 0 : 40,
  },
  phone: {
    width: 280,
    height: 560,
    backgroundColor: colors.text,
    borderRadius: 40,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  phoneNotch: {
    width: 120,
    height: 28,
    backgroundColor: colors.text,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 8,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  screenIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  screenDesc: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  screenDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },

  // Video Section
  videoSection: {
    padding: 20,
    paddingVertical: 60,
    backgroundColor: colors.background,
  },
  videoContainer: {
    marginTop: 30,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  videoPlaceholder: {
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  videoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  videoPlayText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  videoDuration: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  videoPlayer: {
    backgroundColor: colors.white,
    padding: 20,
    minHeight: 400,
  },
  demoScroll: {
    flexGrow: 0,
  },
  demoSlide: {
    width: 280,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    marginRight: 16,
  },
  demoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  demoText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  closeVideo: {
    alignItems: 'center',
    padding: 16,
    marginTop: 20,
  },
  closeVideoText: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Sections
  section: {
    padding: 20,
    paddingVertical: 60,
  },
  sectionAlt: {
    backgroundColor: colors.white,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 500,
    alignSelf: 'center',
  },

  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  featureCard: {
    width: isWeb ? 320 : '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
  },

  // Steps
  stepsContainer: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  stepCard: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  stepContent: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  stepDesc: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
  },

  // Caregiver CTA
  caregiverCTA: {
    backgroundColor: colors.primary + '10',
    borderRadius: 16,
    padding: 24,
    marginTop: 40,
    alignItems: 'center',
  },
  caregiverCTATitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  caregiverCTAText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  caregiverCTAButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  caregiverCTAButtonText: {
    color: colors.white,
    fontWeight: '600',
  },

  // Testimonials
  testimonialScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  testimonialCard: {
    width: 300,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    marginRight: 16,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  testimonialAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  testimonialRole: {
    fontSize: 12,
    color: colors.textMuted,
  },
  testimonialText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
  },

  // Senior Mode
  seniorModeCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 500,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  seniorModeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  seniorModeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  seniorModeText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  seniorModeFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  seniorFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  seniorFeatureText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },

  // Final CTA
  finalCTA: {
    marginHorizontal: 20,
    marginVertical: 40,
    borderRadius: 24,
    overflow: 'hidden',
  },
  ctaGradient: {
    padding: 40,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ctaButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonPrimaryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  ctaButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonSecondaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  downloadBadges: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 10,
  },
  badgeSmall: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  badgeLarge: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },

  // Footer
  footer: {
    backgroundColor: colors.text,
    padding: 40,
    alignItems: 'center',
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  footerLogoText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  footerTagline: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 24,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  footerLink: {
    color: '#94A3B8',
    fontSize: 14,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyright: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
