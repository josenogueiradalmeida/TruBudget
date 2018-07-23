import React from "react";

import Badge from "@material-ui/core/Badge";
import BubbleIcon from "@material-ui/icons/DeviceHub";
import IconButton from "@material-ui/core/IconButton";
import { withStyles } from "@material-ui/core/styles";

import strings from "../../localizeStrings";
import Tooltip from "@material-ui/core/Tooltip";

const styles = {
  badge: {
    top: "-2px",
    right: "-2px"
  }
};

const NumberOfPeersIcon = ({ numberOfActivePeers, classes }) => {
  return (
    <Badge classes={{ badge: classes.badge }} badgeContent={numberOfActivePeers} color="primary">
      <Tooltip title={strings.navigation.connected_peers}>
        <IconButton tooltip={strings.navigation.connected_peers}>
          <BubbleIcon color="primary" />
        </IconButton>
      </Tooltip>
    </Badge>
  );
};

export default withStyles(styles)(NumberOfPeersIcon);
