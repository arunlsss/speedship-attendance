(() => {
  'use strict';
  const options = new URLSearchParams(location.search);
  const paths = {
    '/management-login.html': 'management',
    '/login.html': 'management',
    '/pto.html': options.get('view') === 'management' ? 'management' : 'employee'
  };
  const audience = paths[location.pathname];
  if (!audience || options.has('legacy')) return;

  function check() {
    let session, current, workspace;
    try {
      session = JSON.parse(sessionStorage.getItem('sss_sso_session') || 'null');
      current = JSON.parse(sessionStorage.getItem('firebase:authUser:AIzaSyB9-tZ4__3C9Ihc-5x3gxt3b8XyYZN_X68:[DEFAULT]') || 'null');
      workspace = JSON.parse(sessionStorage.getItem('sss_workspace_context') || 'null');
    } catch { /* Treat invalid storage as a missing session. */ }
    if (session?.audience === audience && session.uid && session.uid === current?.uid) return;
    // Embedded sessions must reconnect through the parent, never through a nested sign-in.
    if (parent !== window && workspace?.system === 'attendance' &&
        workspace.parent === location.ancestorOrigins?.[0] &&
        ['https://speedship-management.web.app', 'https://management.speedshipsolution.com'].includes(workspace.parent) &&
        workspace.expires > Date.now()) return;
    location.replace('/sso.html?audience=' + audience);
  }
  check();
  new MutationObserver(check).observe(document.body, {childList: true, subtree: true});
})();
