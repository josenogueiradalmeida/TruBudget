describe("Users/Groups Dashboard", function() {
  before(() => {
    cy.login();
    cy.visit("/users");
  });

  it("User can edit his/her own user profile", function() {
    cy.get("[data-test=edit-user-mstein]").should("be.visible");
  });

  it("Before the user enters the password, he/she cannot proceed", function() {
    cy.get("[data-test=edit-user-mstein]").should("be.visible");
    cy.get("[data-test=edit-user-mstein]").click();

    // When the window is opened, the "Next" button is disabled
    cy.get("[data-test=next]").should("be.disabled");

    // Leave the window
    cy.get("[data-test=cancel]").click();
  });

  it("The user can't proceed if the wrong password is given", function() {
    cy.get("[data-test=edit-user-mstein]").should("be.visible");

    // User enters wrong password
    cy.get("[data-test=edit-user-mstein]").click();
    cy.get("[data-test=userPasswordField] input").type("asdf");
    cy.get("[data-test=userPasswordEnter]").click();

    // The warning "Incorrect password" is displayed
    // and the "Next" button is disabled
    cy.get("#password-helper-text").contains("Incorrect password");
    cy.get("[data-test=next]").should("be.disabled");

    // Leave the window
    cy.get("[data-test=cancel]").click();
  });

  it("The user can proceed if the correct password is given and update the password", function() {
    cy.get("[data-test=edit-user-mstein]").should("be.visible");

    // User enters correct password
    cy.get("[data-test=edit-user-mstein]").click();
    cy.get("[data-test=userPasswordField] input").type("test");
    cy.get("[data-test=userPasswordEnter]").click();

    // The "Enter button" now displays "OK"
    cy.get("[data-test=userPasswordEnter]").contains("OK");

    // Go to the next page
    cy.get("[data-test=next]").should("be.enabled");
    cy.get("[data-test=next]").click();

    // Enter the new password
    // This is the same as the old one, but this does not matter for this test
    cy.get("[data-test=password-textfield] input").type("test");
    cy.get("[data-test=submit]").click();

    // A success snackbar is displayed
    cy.get("#client-snackbar")
      .should("be.visible")
      .contains("successfully edited");

    // The user table should be visible again
    cy.get("[data-test=userdashboard]").should("be.visible");
  });

  it("If the password is updated, the new password is activated immediately", function() {
    cy.get("[data-test=edit-user-mstein]").should("be.visible");

    // User enters correct password
    cy.get("[data-test=edit-user-mstein]").click();
    cy.get("[data-test=userPasswordField] input").type("test");
    cy.get("[data-test=userPasswordEnter]").click();

    // The "Enter button" now displays "OK"
    cy.get("[data-test=userPasswordEnter]").contains("OK");

    // Go to the next page
    cy.get("[data-test=next]").should("be.enabled");
    cy.get("[data-test=next]").click();

    // Enter the new password
    cy.get("[data-test=password-textfield] input").type("test2");
    cy.get("[data-test=submit]").click();

    // A success snackbar is displayed
    cy.get("#client-snackbar")
      .should("be.visible")
      .contains("successfully edited");

    // The user table should be visible again
    cy.get("[data-test=userdashboard]").should("be.visible");

    // Click the button again
    cy.get("[data-test=edit-user-mstein]").should("be.visible");

    // User enters old (wrong) password
    cy.get("[data-test=edit-user-mstein]").click();
    cy.get("[data-test=userPasswordField] input").type("test");
    cy.get("[data-test=userPasswordEnter]").click();

    // The warning "Incorrect password" is displayed
    // and the "Next" button is disabled
    cy.get("#password-helper-text").contains("Incorrect password");
    cy.get("[data-test=next]").should("be.disabled");

    // User enters now the new password
    cy.get("[data-test=userPasswordField] input").clear();
    cy.get("[data-test=userPasswordField] input").type("test2");
    cy.get("[data-test=userPasswordEnter]").click();

    // The "Enter button" now displays "OK"
    cy.get("[data-test=userPasswordEnter]").contains("OK");

    // Go to the next page
    cy.get("[data-test=next]").should("be.enabled");
    cy.get("[data-test=next]").click();

    // Enter the new password to restore the old one
    cy.get("[data-test=password-textfield] input").type("test");
    cy.get("[data-test=submit]").click();

    // A success snackbar is displayed
    cy.get("#client-snackbar")
      .should("be.visible")
      .contains("successfully edited");
  });
});
