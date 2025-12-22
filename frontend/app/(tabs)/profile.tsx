import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';
import { colors } from '../../src/theme/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, profile, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Caregiver profile state
  const [caregiverProfile, setCaregiverProfile] = useState({
    bio: '',
    price_hour: '30',
    price_night: '',
    city: 'Campo Grande',
    neighborhood: '',
    experience_years: '0',
    specializations: [] as string[],
    photo: null as string | null,
  });

  // Client profile state
  const [clientProfile, setClientProfile] = useState({
    elder_name: '',
    elder_age: '',
    elder_address: '',
    elder_city: 'Campo Grande',
    elder_needs: [] as string[],
  });

  const cities = ['Campo Grande', 'São Paulo', 'Curitiba', 'Fortaleza'];
  const allSpecializations = [
    'Cuidados Gerais',
    'Alzheimer/Demência',
    'Pós-Operatório',
    'Fisioterapia',
    'Enfermagem',
    'Acompanhamento Hospitalar',
    'Cuidados Noturnos',
    'Mobilidade Reduzida',
  ];
  const elderNeeds = [
    'Auxílio para alimentação',
    'Auxílio para banho',
    'Administração de medicamentos',
    'Acompanhamento médico',
    'Exercícios físicos',
    'Companhia e conversa',
    'Passeios e saídas',
    'Cuidados noturnos',
  ];

  useEffect(() => {
    if (profile) {
      if (user?.role === 'caregiver') {
        setCaregiverProfile({
          bio: profile.bio || '',
          price_hour: String(profile.price_hour || 30),
          price_night: profile.price_night ? String(profile.price_night) : '',
          city: profile.city || 'Campo Grande',
          neighborhood: profile.neighborhood || '',
          experience_years: String(profile.experience_years || 0),
          specializations: profile.specializations || [],
          photo: profile.photo || null,
        });
      } else if (user?.role === 'client') {
        setClientProfile({
          elder_name: profile.elder_name || '',
          elder_age: profile.elder_age ? String(profile.elder_age) : '',
          elder_address: profile.elder_address || '',
          elder_city: profile.elder_city || 'Campo Grande',
          elder_needs: profile.elder_needs || [],
        });
      }
    }
  }, [profile, user]);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setCaregiverProfile({ ...caregiverProfile, photo: base64Image });
    }
  };

  const toggleSpecialization = (spec: string) => {
    const current = caregiverProfile.specializations;
    if (current.includes(spec)) {
      setCaregiverProfile({
        ...caregiverProfile,
        specializations: current.filter((s) => s !== spec),
      });
    } else {
      setCaregiverProfile({
        ...caregiverProfile,
        specializations: [...current, spec],
      });
    }
  };

  const toggleElderNeed = (need: string) => {
    const current = clientProfile.elder_needs;
    if (current.includes(need)) {
      setClientProfile({
        ...clientProfile,
        elder_needs: current.filter((n) => n !== need),
      });
    } else {
      setClientProfile({
        ...clientProfile,
        elder_needs: [...current, need],
      });
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      if (user?.role === 'caregiver') {
        const profileData = {
          bio: caregiverProfile.bio,
          price_hour: parseFloat(caregiverProfile.price_hour) || 30,
          price_night: caregiverProfile.price_night
            ? parseFloat(caregiverProfile.price_night)
            : null,
          city: caregiverProfile.city,
          neighborhood: caregiverProfile.neighborhood,
          experience_years: parseInt(caregiverProfile.experience_years) || 0,
          specializations: caregiverProfile.specializations,
          available: true,
          certifications: [],
        };

        if (profile) {
          await api.put('/caregivers/profile', profileData);
        } else {
          await api.post('/caregivers/profile', profileData);
        }

        // Upload photo if changed
        if (caregiverProfile.photo && caregiverProfile.photo.startsWith('data:')) {
          const formData = new FormData();
          formData.append('photo_base64', caregiverProfile.photo);
          await api.post('/caregivers/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else if (user?.role === 'client') {
        const profileData = {
          elder_name: clientProfile.elder_name,
          elder_age: parseInt(clientProfile.elder_age) || 0,
          elder_address: clientProfile.elder_address,
          elder_city: clientProfile.elder_city,
          elder_needs: clientProfile.elder_needs,
          preferences: {},
        };

        if (profile) {
          await api.put('/clients/profile', profileData);
        } else {
          await api.post('/clients/profile', profileData);
        }
      }

      await refreshUser();
      setIsEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.detail || 'Falha ao salvar perfil'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderCaregiverProfile = () => (
    <>
      {/* Photo Section */}
      <View style={styles.photoSection}>
        <TouchableOpacity
          style={styles.photoContainer}
          onPress={isEditing ? pickImage : undefined}
          disabled={!isEditing}
        >
          {caregiverProfile.photo ? (
            <Image source={{ uri: caregiverProfile.photo }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Ionicons name="camera" size={40} color={colors.textMuted} />
            </View>
          )}
          {isEditing && (
            <View style={styles.photoEditBadge}>
              <Ionicons name="pencil" size={16} color={colors.white} />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userRole}>Cuidador(a)</Text>
        {profile?.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary[600]} />
            <Text style={styles.verifiedText}>Perfil Verificado</Text>
          </View>
        )}
      </View>

      {/* Profile Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre você</Text>
        <TextInput
          style={[styles.textArea, !isEditing && styles.inputDisabled]}
          placeholder="Descreva sua experiência e habilidades..."
          placeholderTextColor={colors.textMuted}
          value={caregiverProfile.bio}
          onChangeText={(text) => setCaregiverProfile({ ...caregiverProfile, bio: text })}
          multiline
          numberOfLines={4}
          editable={isEditing}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preços</Text>
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Por hora (R$)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              placeholder="30"
              placeholderTextColor={colors.textMuted}
              value={caregiverProfile.price_hour}
              onChangeText={(text) =>
                setCaregiverProfile({ ...caregiverProfile, price_hour: text })
              }
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Plantão noturno (R$)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              placeholder="200"
              placeholderTextColor={colors.textMuted}
              value={caregiverProfile.price_night}
              onChangeText={(text) =>
                setCaregiverProfile({ ...caregiverProfile, price_night: text })
              }
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Localização</Text>
        <Text style={styles.inputLabel}>Cidade</Text>
        <View style={styles.chipContainer}>
          {cities.map((city) => (
            <TouchableOpacity
              key={city}
              style={[
                styles.chip,
                caregiverProfile.city === city && styles.chipActive,
                !isEditing && styles.chipDisabled,
              ]}
              onPress={() =>
                isEditing && setCaregiverProfile({ ...caregiverProfile, city })
              }
              disabled={!isEditing}
            >
              <Text
                style={[
                  styles.chipText,
                  caregiverProfile.city === city && styles.chipTextActive,
                ]}
              >
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.inputLabel}>Bairro</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          placeholder="Seu bairro"
          placeholderTextColor={colors.textMuted}
          value={caregiverProfile.neighborhood}
          onChangeText={(text) =>
            setCaregiverProfile({ ...caregiverProfile, neighborhood: text })
          }
          editable={isEditing}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experiência</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          placeholder="Anos de experiência"
          placeholderTextColor={colors.textMuted}
          value={caregiverProfile.experience_years}
          onChangeText={(text) =>
            setCaregiverProfile({ ...caregiverProfile, experience_years: text })
          }
          keyboardType="numeric"
          editable={isEditing}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Especializações</Text>
        <View style={styles.chipContainer}>
          {allSpecializations.map((spec) => (
            <TouchableOpacity
              key={spec}
              style={[
                styles.chip,
                caregiverProfile.specializations.includes(spec) && styles.chipActive,
                !isEditing && styles.chipDisabled,
              ]}
              onPress={() => isEditing && toggleSpecialization(spec)}
              disabled={!isEditing}
            >
              <Text
                style={[
                  styles.chipText,
                  caregiverProfile.specializations.includes(spec) && styles.chipTextActive,
                ]}
              >
                {spec}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  const renderClientProfile = () => (
    <>
      {/* User Info Section */}
      <View style={styles.photoSection}>
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="person" size={40} color={colors.textMuted} />
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userRole}>Familiar</Text>
      </View>

      {/* Elder Profile Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações do Idoso</Text>
        <Text style={styles.inputLabel}>Nome do idoso</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          placeholder="Nome completo do idoso"
          placeholderTextColor={colors.textMuted}
          value={clientProfile.elder_name}
          onChangeText={(text) => setClientProfile({ ...clientProfile, elder_name: text })}
          editable={isEditing}
        />
        <Text style={styles.inputLabel}>Idade</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          placeholder="Idade"
          placeholderTextColor={colors.textMuted}
          value={clientProfile.elder_age}
          onChangeText={(text) => setClientProfile({ ...clientProfile, elder_age: text })}
          keyboardType="numeric"
          editable={isEditing}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Endereço</Text>
        <Text style={styles.inputLabel}>Cidade</Text>
        <View style={styles.chipContainer}>
          {cities.map((city) => (
            <TouchableOpacity
              key={city}
              style={[
                styles.chip,
                clientProfile.elder_city === city && styles.chipActive,
                !isEditing && styles.chipDisabled,
              ]}
              onPress={() =>
                isEditing && setClientProfile({ ...clientProfile, elder_city: city })
              }
              disabled={!isEditing}
            >
              <Text
                style={[
                  styles.chipText,
                  clientProfile.elder_city === city && styles.chipTextActive,
                ]}
              >
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.inputLabel}>Endereço completo</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          placeholder="Rua, número, bairro"
          placeholderTextColor={colors.textMuted}
          value={clientProfile.elder_address}
          onChangeText={(text) =>
            setClientProfile({ ...clientProfile, elder_address: text })
          }
          editable={isEditing}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Necessidades do idoso</Text>
        <View style={styles.chipContainer}>
          {elderNeeds.map((need) => (
            <TouchableOpacity
              key={need}
              style={[
                styles.chip,
                clientProfile.elder_needs.includes(need) && styles.chipActive,
                !isEditing && styles.chipDisabled,
              ]}
              onPress={() => isEditing && toggleElderNeed(need)}
              disabled={!isEditing}
            >
              <Text
                style={[
                  styles.chipText,
                  clientProfile.elder_needs.includes(need) && styles.chipTextActive,
                ]}
              >
                {need}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (isEditing ? saveProfile() : setIsEditing(true))}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary[600]} />
          ) : (
            <Text style={styles.editButtonText}>
              {isEditing ? 'Salvar' : 'Editar'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {user?.role === 'caregiver' ? renderCaregiverProfile() : renderClientProfile()}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutButtonText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    backgroundColor: colors.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    padding: 6,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 12,
  },
  userRole: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  verifiedText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.secondary[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDisabled: {
    backgroundColor: colors.secondary[100],
  },
  textArea: {
    backgroundColor: colors.secondary[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.secondary[50],
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipDisabled: {
    opacity: 0.7,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.white,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    marginTop: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '500',
  },
});
