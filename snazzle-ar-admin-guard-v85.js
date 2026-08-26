// AR v85 guard: oude v83 beheer-UI mag niet opnieuw zichtbaar worden na auth- of admin-rerenders.
function removeLegacyArAdmin(){
  document.getElementById('snArAdminV83')?.remove();
  document.getElementById('snArAdminTab')?.remove();
}
removeLegacyArAdmin();
const arAdminGuard=new MutationObserver(removeLegacyArAdmin);
if(document.body) arAdminGuard.observe(document.body,{childList:true,subtree:true});
else document.addEventListener('DOMContentLoaded',()=>arAdminGuard.observe(document.body,{childList:true,subtree:true}),{once:true});
