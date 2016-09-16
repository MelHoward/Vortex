import { setLoggedInUser } from '../actions/actions';
import { II18NProps } from '../types/II18NProps';
import { log } from '../util/log';
import { Button } from './TooltipControls';

import { Client } from 'node-rest-client';
import * as React from 'react';
import { FormControl, FormGroup, ControlLabel } from 'react-bootstrap';
import { translate } from 'react-i18next';
import { connect } from 'react-redux';
import Icon = require('react-fontawesome');
import FontAwesome = require('react-fontawesome');
import update = require('react-addons-update');

interface ILoginFormProps {
    onClose: () => void; 
}

interface ILoginFormState {
  username: string;
  password: string;
  isSubmitted: boolean;
}

interface ILoginFormConnectedProps {
  account: any;
}

interface ILoginFormActionProps {
  onSetAccount: (username: string, sid: string) => void;
}

class LoginFormBase extends React.Component<
  ILoginFormProps & ILoginFormConnectedProps & ILoginFormActionProps & II18NProps, ILoginFormState> {
  constructor(props) {
      super(props);
      this.state = { username: '', password: '', isSubmitted: false };
  }

  public render(): JSX.Element {
    let { t } = this.props;
    return (
        <form onSubmit={ this.LoginAuthentication } >
            <FormGroup controlId="formUsernameValidation" validationState={!this.state.isSubmitted ? "neutral" : this.state.username.length > 0 ? "success" : "warning"}>
                <ControlLabel>{!this.state.isSubmitted ? "" : this.state.username.length > 0 ? "" : "Missing username"}</ControlLabel>
            <FormControl
            type='text'
            name='username'
            value={ this.state.username }
            placeholder={ t('Nexus Accountname') }
            onChange={ this.handleChangeUsername } />
            <FormControl.Feedback />
            </FormGroup>
            <FormGroup controlId="formPasswordValidation" validationState={!this.state.isSubmitted ? "neutral" : this.state.password.length > 0 ? "success" : "warning"}>
                <ControlLabel>{!this.state.isSubmitted ? "" : this.state.password.length > 0 ? "" : "Missing password"}</ControlLabel>
         <FormControl
          type='password'
          name='password'
          value={this.state.password}
          placeholder={ t('Nexus Password') }
          onChange={ this.handleChangePassword }/>
        </FormGroup>
        <Button id='submit-login' type='submit' tooltip={t('Submit') }>
          { t('Submit') }
        </Button>
      </form>
    );
  };

  public handleChange(event, field) {
    this.setState(update(this.state, { [field]: { $set: event.target.value } }));
  }

  private LoginAuthenticationImpl() {
    let { onClose, onSetAccount } = this.props;
    let { username, password } = this.state;

    let client = new Client();

    this.setState(update(this.state, { isSubmitted: { $set: true } }))
  
    let args = {
      path: { username, password },
      parameters: { Login: null, username, password },
      headers: { 'user-agent': 'Nexus Client v0.62.28' },
    };

    client.get('http://nmm.nexusmods.com/Sessions/', args,
      (data, response) => {
        log('debug', 'STATUS', response.statusCode);
        log('debug', 'HEADERS', JSON.stringify(response.headers));

        let cookies = response.headers['set-cookie'];

        if (cookies !== undefined) {
          let fields: string[] = cookies[0].split(';');
          let sid = fields
            .find((field) => field.startsWith('sid='))
            .split('=')
          [1];
          log('debug', 'SID', sid);

          onSetAccount(username, sid);

          response.setEncoding('utf8');
          response.on('data', (chunk) => {
            log('debug', 'BODY', chunk);
          });

          onClose();
        }
      });
  }

  private LoginAuthentication = (event: Event) => {
    event.preventDefault();
    this.LoginAuthenticationImpl();
  }

  private handleChangeUsername = (event) => this.handleChange(event, 'username');
  private handleChangePassword = (event) => this.handleChange(event, 'password');
}

function mapStateToProps(state: any): ILoginFormConnectedProps {
  return { account: state.account };
}

function mapDispatchToProps(dispatch: Function): ILoginFormActionProps {
  return {
    onSetAccount: (username: string, sid: string) => dispatch(setLoggedInUser(username, sid)),
  };
}

const LoginForm = connect(mapStateToProps, mapDispatchToProps)(LoginFormBase) as React.ComponentClass<ILoginFormProps>;

export default translate(['common'], { wait: true })(LoginForm);
