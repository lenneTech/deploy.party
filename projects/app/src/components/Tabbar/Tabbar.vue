<template>
  <div
    class="fixed bottom-0 z-50 left-0 right-0 bg-background border-t border-border flex items-center justify-between lg:hidden p-4 pb-[calc(env(safe-area-inset-bottom)_+_1rem)]"
  >
    <TabbarItem to="/" icon="ic:dashboard" title="Dashboard" />
    <TabbarItem to="/projects" icon="ic:baseline-menu-open" title="Projects" />
    <TabbarItem to="/sources" icon="ic:round-apps" title="Sources" />
    <TabbarItem to="/team" icon="ic:baseline-groups" title="Team" />
  </div>
</template>
