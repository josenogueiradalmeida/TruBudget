import React, { Component } from "react";
import Avatar from "material-ui/Avatar";

import Chip from "material-ui/Chip";
import {
  Table,
  TableBody,
  TableFooter,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn
} from "material-ui/Table";

import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";

import TextField from "material-ui/TextField";
import Dialog from "material-ui/Dialog";

import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import AutoComplete from "material-ui/AutoComplete";

import strings from "../../localizeStrings";

const styles = {
  container: {
    padding: 0
  },
  dialog: {
    padding: 0
  },
  contentStyle: {
    width: "40%",
    maxWidth: "none"
  },
  tableBody: {
    height: "75px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }
};

const AssigneeDialog = ({ assigneeId, users, title, show, onClose, changeAssignee }) => {
  return (
    <Dialog
      title={title}
      actions={[<FlatButton label="Close" primary={true} onClick={() => onClose()} />]}
      modal={true}
      open={show}
      autoScrollBodyContent={true}
      bodyStyle={styles.dialog}
      contentStyle={styles.contentStyle}
    >
      <div style={styles.container}>
        <AssigneeTable changeAssignee={changeAssignee} assigneeId={assigneeId} users={users} />
      </div>
    </Dialog>
  );
};

const colors = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Black", "White"];

const selectionStyle = {
  searchContainer: {
    marginLeft: "12px",
    marginRight: "12px"
  },
  selectionContainer: {}
};

class AssigneeTable extends Component {
  constructor() {
    super();
    this.state = {
      searchTerm: ""
    };
  }

  renderUsers(users, assigneeId) {
    return users.map(u => {
      const { id, displayName } = u;
      return (
        <MenuItem
          key={id}
          checked={id === assigneeId}
          insetChildren={true}
          value={displayName}
          primaryText={displayName}
          onClick={() => this.props.changeAssignee(id)}
        />
      );
    });
  }

  renderTitle(assignee) {
    if (!assignee) {
      return "...";
    }
    return assignee.displayName;
  }

  render() {
    const { assigneeId, users } = this.props;
    const selection = this.renderUsers(
      users.filter(u => u.displayName.toLowerCase().includes(this.state.searchTerm.toLowerCase())),
      assigneeId
    );
    const assignee = users.find(user => user.id === assigneeId);

    return (
      <Table style={{ maxHeight: "250px" }} selectable={false}>
        <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
          <TableRow>
            <TableHeaderColumn>Assignee</TableHeaderColumn>
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>
          <TableRow style={styles.tableBody}>
            <TableRowColumn>
              <SelectField
                multiple={true}
                hintText={this.renderTitle(assignee)}
                maxHeight={250}
                autoWidth={true}
                dropDownMenuProps={{
                  onClose: () => this.setState({ searchTerm: "" })
                }}
              >
                <div style={selectionStyle.searchContainer}>
                  <TextField
                    fullWidth
                    hintText="Search"
                    onChange={e => this.setState({ searchTerm: e.target.value })}
                  />
                </div>
                <div style={selectionStyle.selectionContainer}>{selection}</div>
              </SelectField>
            </TableRowColumn>
          </TableRow>
        </TableBody>
      </Table>
    );
  }
}

export default AssigneeDialog;