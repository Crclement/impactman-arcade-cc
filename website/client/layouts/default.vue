<template>
  <TemplatesPageWithLoader class="bg-blizzardBlue pt-3.5 xl:pt-8">
    <div class="container">
      <OrganismsHeader />
    </div>
    <main>
      <slot />
    </main>
    <OrganismsFooter />
  </TemplatesPageWithLoader>
</template>
