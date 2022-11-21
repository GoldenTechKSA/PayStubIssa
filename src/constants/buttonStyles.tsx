import "bootstrap/dist/css/bootstrap.min.css";
import { Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

export const StyledButton = withStyles({
    root: {
    //   background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
      background: 'linear-gradient(135deg, green 30%, cyan)',
      borderRadius: 7,
      border: 0,
      color: 'white',
      height: 48,
      padding: '0 70px',
      boxShadow: '0 3px 5px 2px rgba(19, 105, 13, .7)',
    },
    label: {
      textTransform: 'capitalize',
    },
  })(Button);

//   const StyledButton = withStyles({
//     root: {
//       background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
//       borderRadius: 3,
//       border: 0,
//       color: 'white',
//       height: 48,
//       padding: '0 30px',
//       boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
//     },
//     label: {
//       textTransform: 'capitalize',
//     },
//   })(Button);
