import React from 'react';
import {Link} from 'react-router-dom';
import {connect} from 'react-redux';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

import * as ROUTES from '../../constants/routes';

import BrandLogo from '../BrandLogo/BrandLogo';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Search from '../Search/Search';
import SignOut from '../Authentication/SignOut';

const bookShelfLink = (
  <Link to={ROUTES.MY_BOOK_HISTORY} className="navbar-bookshelves">
    <FontAwesomeIcon icon="book" />
  </Link>
);

const accountMenu = (
  <DropdownMenu.Root modal={false}>
    <DropdownMenu.Trigger asChild>
      <button className="dd-header navbar-account navbar-account-trigger" aria-label="Account menu">
        <FontAwesomeIcon icon="user" />
      </button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        className="dd-list navbar-account-menu"
        align="end"
        sideOffset={8}>
        <DropdownMenu.Item asChild>
          <Link to={ROUTES.ACCOUNT} className="dd-list-item link">
            <FontAwesomeIcon icon="user" /> My Profile
          </Link>
        </DropdownMenu.Item>
        <DropdownMenu.Item asChild>
          <Link to={ROUTES.EDIT_PROFILE} className="dd-list-item link">
            <FontAwesomeIcon icon="edit" /> Edit Profile
          </Link>
        </DropdownMenu.Item>
        <DropdownMenu.Item asChild>
          <Link to={ROUTES.SETTINGS} className="dd-list-item link">
            <FontAwesomeIcon icon="cog" /> Settings
          </Link>
        </DropdownMenu.Item>
        <DropdownMenu.Separator className="dd-separator" />
        <DropdownMenu.Item asChild>
          <div className="dd-list-item link dd-signout">
            <FontAwesomeIcon icon="sign-out-alt" />
            <SignOut />
          </div>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
);

const NavbarAuth = ({authUser}) => (
  <React.Fragment>
    {bookShelfLink}
    {accountMenu}
  </React.Fragment>
);

const NavbarNonAuth = () => (
  <div className="navbar-authentication">
    <Link to={ROUTES.LOG_IN} className="login">
      LOG IN
    </Link>
    <span className="spacer" />
    <Link to={ROUTES.SIGN_UP} className="register">
      REGISTER
    </Link>
  </div>
);

const Navbar = props => (
  <nav className="navbar">
    <div className="navbar-content-container">
      <BrandLogo />
      <Search />
      {props.authUser ? (
        <NavbarAuth authUser={props.authUser} />
      ) : (
        <NavbarNonAuth />
      )}
    </div>
  </nav>
);

const mapStateToProps = state => ({
  authUser: state.sessionState.authUser
});

export default connect(mapStateToProps)(Navbar);
