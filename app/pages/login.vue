<script setup lang="ts">
definePageMeta({
  ssr: false
})

const supabase = useSupabaseClient()
const email = ref('')
const otp = ref('')
const otpSent = ref(false)
const otpType = ref<'email' | 'invite' | null>(null)
const loading = ref(false)
const verifying = ref(false)
const toast = useToast()

const translateErrorCode = (errorCode: string) => {
  switch (errorCode) {
    case 'invalid_email':
      return 'L\'adresse e-mail fournie est invalide.'
    case 'user_not_found':
      return 'Aucun·e utilisateur·ice trouvé·e avec cette adresse e-mail. Veuillez utiliser l\'adresse e-mail que vous avez utilisée lors de votre adhésion.'
    default:
      return 'Une erreur inconnue est survenue.'
  }
}

const getNormalizedEmail = () => email.value.trim().toLowerCase()

const sendInvite = async () => {
  const normalizedEmail = getNormalizedEmail()
  if (!normalizedEmail) {
    toast.add({
      title: 'Adresse e-mail manquante',
      description: 'Veuillez saisir votre adresse e-mail avant de demander un code.',
      icon: 'tabler:alert-triangle',
      color: 'warning',
    })
    return
  }

  email.value = normalizedEmail
  loading.value = true
  const { data: response, error } = await supabase.functions.invoke('send-invite', { body: { email: normalizedEmail } })
  const errorCode = (await error?.context.json())?.error
  loading.value = false

  if (error) {
    toast.add({
      title: 'Erreur' + (errorCode ? ` (${errorCode})` : ''),
      description: errorCode == null
        ? 'Une erreur est survenue lors de l\'envoi du code.'
        : translateErrorCode(errorCode),
      icon: 'tabler:alert-triangle',
      color: 'error',
    })
    return
  }

  otp.value = ''
  otpSent.value = true
  otpType.value = response?.otpType === 'invite' ? 'invite' : 'email'

  toast.add({
    title: 'Code envoyé',
    description: 'Vérifiez votre boîte e-mail et saisissez le code reçu pour continuer.',
    icon: 'tabler:check',
    color: 'success',
  })
}

const verifyOtpCode = async () => {
  const normalizedEmail = getNormalizedEmail()
  if (!normalizedEmail || !otpSent.value) {
    toast.add({
      title: 'Code introuvable',
      description: 'Demandez d\'abord un code en entrant votre adresse e-mail.',
      icon: 'tabler:alert-triangle',
      color: 'warning',
    })
    return
  }

  const cleanedOtp = otp.value.trim()
  if (!cleanedOtp) {
    toast.add({
      title: 'Code manquant',
      description: 'Veuillez saisir le code reçu par e-mail.',
      icon: 'tabler:alert-triangle',
      color: 'warning',
    })
    return
  }

  verifying.value = true
  const type = otpType.value === 'invite' ? 'invite' : 'email'
  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token: cleanedOtp,
    type,
  })
  verifying.value = false

  if (error) {
    toast.add({
      title: 'Code invalide',
      description: 'Le code est incorrect ou expiré. Demandez un nouveau code.',
      icon: 'tabler:alert-triangle',
      color: 'error',
    })
    return
  }

  toast.add({
    title: 'Connexion réussie',
    description: 'Vous êtes maintenant connecté·e.',
    icon: 'tabler:check',
    color: 'success',
  })
  await nextTick()
  navigateTo('/internal/profile')
}

onMounted(async () => {
  const user = useSupabaseUser()

  if (user.value) {
    toast.add({
      title: 'Déjà connecté·e',
      description: 'Vous êtes déjà connecté·e.',
      icon: 'tabler:check',
      color: 'success',
    })
    await nextTick()
    navigateTo("/internal/profile")
  }

})

// SEO setup
useSeoMeta({
  title: 'Se connecter - Sursaut!',
  description: 'Connectez-vous à votre espace membre de Sursaut!, le journal des luttes de Bordeaux.',
  keywords: 'connexion, membre, Bordeaux, luttes sociales, politique, journal',
  robots: 'noindex, follow', // Login pages shouldn't be indexed
  
  // Open Graph
  ogTitle: 'Se connecter - Sursaut!',
  ogDescription: 'Connectez-vous à votre espace membre de Sursaut!.',
  ogImage: 'https://sursaut-revue.fr/icon-512x512.png',
  ogUrl: 'https://sursaut-revue.fr/login',
  ogType: 'website',
  ogSiteName: 'Sursaut!',
  ogLocale: 'fr_FR',
  
  // Twitter
  twitterCard: 'summary_large_image',
  twitterTitle: 'Se connecter - Sursaut!',
  twitterDescription: 'Connectez-vous à votre espace membre de Sursaut!.',
  twitterImage: 'https://sursaut-revue.fr/icon-512x512.png',
})

// Canonical link
useHead({
  link: [
    { rel: 'canonical', href: 'https://sursaut-revue.fr/login' }
  ]
})
</script>
<template>
  <div class="max-w-xl mx-auto w-full">
    <div class="flex flex-col h-full p-4 md:py-8">
      <h1 class="font-serif text-3xl">Se connecter</h1>
      <p class="text-gray-600 mb-6 max-w-lg mt-2">Veuillez entrer votre adresse e-mail pour recevoir un code de
        connexion. Celle-ci doit être identique à celle utilisée lors de votre adhésion. En cas de problème contactez <a
          href="mailto:solidairesetu33@gmail.com" class="underline">solidairesetu33@gmail.com</a>.</p>
      <div
        class="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        role="alert"
      >
        Pensez à vérifier votre dossier spam.
      </div>
      <UInput label="E-Mail" placeholder="jean@dupont.fr" v-model="email" type="email" class="mb-4"
        :disabled="loading || verifying" />
      <UButton @click="sendInvite" icon="tabler:mail" class="mb-6" :loading="loading"
        :disabled="verifying">
        {{ loading ? 'Envoi du code...' : otpSent ? 'Renvoyer un code' : 'Recevoir le code de connexion' }}
      </UButton>

      <Transition name="fade">
        <div v-if="otpSent" class="flex flex-col gap-4">
          <UInput label="Code reçu par e-mail" placeholder="123456" v-model="otp" type="text" inputmode="numeric"
            maxlength="6" :disabled="verifying" />
          <UButton @click="verifyOtpCode" icon="tabler:lock" :loading="verifying">
            {{ verifying ? 'Vérification...' : 'Valider le code' }}
          </UButton>
        </div>
      </Transition>
    </div>
  </div>
</template>
