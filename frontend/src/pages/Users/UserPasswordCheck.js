import Button from "@material-ui/core/Button";
import React from "react";
import { connect } from "react-redux";

import strings from "../../localizeStrings";
import Password from "../Common/Password";
import { checkUserPassword, storePassword } from "./actions";

const styles = {
  container: {
    marginTop: 20,
    display: "flex",
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  password: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  button: {
    width: "auto",
    whiteSpace: "nowrap",
    marginLeft: "20px",
    marginRight: "20px",
    justifyContent: "center",
    alignItems: "center"
  },
  buttonOK: {
    width: "auto",
    whiteSpace: "nowrap",
    marginLeft: "20px",
    marginRight: "20px",
    justifyContent: "center",
    alignItems: "center",
    color: "green"
  }
};

const UserPasswordCheck = ({ username, password, wrongPasswordGiven, storePassword, checkUserPassword }) => {
  const isButtonOK = wrongPasswordGiven === undefined ? false : !wrongPasswordGiven;
  return (
    <div style={styles.container}>
      <span style={{ width: "40%" }}>
        <Password
          data-test="userPasswordField"
          password={password}
          storePassword={storePassword}
          failed={wrongPasswordGiven}
          nextBestAction={() => checkUserPassword(username, password)}
          id="password"
        />
      </span>

      <Button
        data-test="userPasswordEnter"
        style={styles.button}
        onClick={() => checkUserPassword(username, password)}
        variant="contained"
        id="loginbutton"
        disabled={isButtonOK}
      >
        {isButtonOK ? "OK" : strings.users.enter_password}
      </Button>
    </div>
  );
};

const mapDispatchToProps = dispatch => {
  return {
    storePassword: password => dispatch(storePassword(password)),
    checkUserPassword: (username, password) => dispatch(checkUserPassword(username, password))
  };
};

const mapStateToProps = state => {
  return {
    password: state.getIn(["users", "password"]),
    wrongPasswordGiven: state.getIn(["users", "wrongPasswordGiven"])
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(UserPasswordCheck);
