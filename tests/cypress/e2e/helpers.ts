export function loginGrafana(grafanaUsername: string, passwordGrafana: string) {
  cy.visit('/login');
  cy.get('input[name="user"]').type(grafanaUsername);
  cy.get('input[name="password"]').type(passwordGrafana);
  cy.get('[aria-label="Login button"]').click();
}
