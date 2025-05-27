<script setup lang="ts">
const supabase = useSupabaseClient()
const email = ref('')
const loading = ref(false)
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

const sendInvite = async () => {
  loading.value = true
  const { data, error } = await supabase.functions.invoke('send-invite', { body: { email: email.value, redirectTo: useRequestURL().href } })
  const errorCode = (await error?.context.json())?.error
  loading.value = false
  if (error) {
    toast.add({
      title: 'Erreur' + (errorCode ? ` (${errorCode})` : ''),
      description: errorCode == null
        ? 'Une erreur est survenue lors de l\'envoi de l\'invitation.'
        : translateErrorCode(errorCode),
      icon: 'tabler:alert-triangle',
      color: 'error',
    })
  } else {
    toast.add({
      title: 'Invitation envoyée',
      description: 'Vous recevrez bientôt un email pour vous connecter.',
      icon: 'tabler:check',
      color: 'success',
    })
    email.value = ''
  }
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

  const tokenHash = useRoute().query.token

  if (tokenHash && typeof tokenHash === 'string') {
    console.log('Token hash:', tokenHash)
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
    console.log(data, error)
    if (error) {
      toast.add({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la connexion.',
        icon: 'tabler:alert-triangle',
        color: 'error',
      })
    } else {
      toast.add({
        title: 'Connexion réussie',
        description: 'Vous êtes maintenant connecté·e.',
        icon: 'tabler:check',
        color: 'success',
      })
      await nextTick()
      navigateTo("/internal/profile")
    }
  }
})
</script>
<template>
  <div class="flex flex-col h-full p-4 md:py-8">
    <h1 class="font-serif text-3xl">Se connecter</h1>
    <p class="text-gray-600 mb-6 max-w-lg mt-2">Veuillez entrer votre adresse e-mail pour vous connecter. Celle-ci doit
      être identique à celle utilisée lors de votre adhésion, en cas de problème contacter <a
        href="mailto:solidairesetu33@gmail.com" class="underline">solidairesetu33@gmail.com</a>.</p>
    <UInput label="E-Mail" placeholder="jean@dupont.fr" v-model="email" type="email" class="mb-4" />
    <UButton @click="sendInvite" icon="tabler:mail" :loading="loading">
      {{ loading ? 'Envoi en cours...' : 'Recevoir le lien de connexion' }}
    </UButton>
  </div>
</template>
