import 'docs/src/modules/components/bootstrap';
// --- Post bootstrap -----
import React from 'react';
import PropTypes from 'prop-types';
import App, { Container } from 'next/app';
import find from 'lodash/find';
import { Provider as ReduxProvider } from 'react-redux';
import AppWrapper from 'docs/src/modules/components/AppWrapper';
import initRedux from 'docs/src/modules/redux/initRedux';
import { loadCSS } from 'fg-loadcss/src/loadCSS';
import PageContext from 'docs/src/modules/components/PageContext';
import GoogleAnalytics from 'docs/src/modules/components/GoogleAnalytics';
import loadScript from 'docs/src/modules/utils/loadScript';

import pages1 from 'docs/src/pages';
import {isBrowser, isMobile,isTablet} from 'react-device-detect';

// Add the strict mode back once the number of warnings is manageable.
// We might miss important warnings by keeping the strict mode 🌊🌊🌊.
const USE_STRICT_MODE = false;
const ReactMode = USE_STRICT_MODE ? React.StrictMode : React.Fragment;

let dependenciesLoaded = false;

function loadDependencies() {
  if (dependenciesLoaded) {
    return;
  }

  dependenciesLoaded = true;

  loadCSS(
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    document.querySelector('#material-icon-font'),
  );
  loadScript('https://www.google-analytics.com/analytics.js', document.querySelector('head'));
}
// eslint-disable-next-line no-console
if (process.browser) {
  // eslint-disable-next-line no-console
  console.log(
    `%c

🌊🌊🌊 

`,
    'font-family:monospace;color:#1976d2;font-size:12px;',
  );
}

function findActivePage(currentPages, router) {
  const activePage = find(currentPages, page => {
    if (page.children) {
      return router.pathname.indexOf(`${page.pathname}/`) === 0;
    }

    // Should be an exact match if no children
    return router.pathname === page.pathname;
  });

  if (!activePage) {
    return null;
  }

  // We need to drill down
  if (activePage.pathname !== router.pathname) {
    return findActivePage(activePage.children, router);
  }

  return activePage;
}

class MyApp extends App {
  constructor(props) {
    super();
    this.redux = initRedux(props.pageProps.reduxServerState);
  }

  componentDidMount() {
    loadDependencies();
  }

  render() {
    const { Component, pageProps, router } = this.props;
    
    let pages = pages1;

    let pathname = router.pathname;
    // Add support for leading / in development mode.
    if (pathname !== '/') {
      // The leading / is only added to support static hosting (resolve /index.html).
      // We remove it to normalize the pathname.
      // See `_rewriteUrlForNextExport` on Next.js side.
      pathname = pathname.replace(/\/$/, '');
    }

    if(isMobile || isTablet) {
      pages = pages1.filter( page =>{
       return page.title !=='CV'
       }
      )
     }

    const activePage = findActivePage(pages, { ...router, pathname });

    return (
      <ReactMode>
        <Container>
          <ReduxProvider store={this.redux}>
            <PageContext.Provider value={{ activePage, pages }}>
              <AppWrapper>
                <Component {...pageProps} />
              </AppWrapper>
            </PageContext.Provider>
          </ReduxProvider>
          <GoogleAnalytics key={router.route} />
        </Container>
      </ReactMode>
    );
  }
}
MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
};

MyApp.getInitialProps = async ({ ctx, Component }) => {
  let pageProps = {};

  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx);
  }

  return {
    pageProps: {
      userLanguage: ctx.query.userLanguage || 'en',
      ...pageProps,
    },
  };
};

export default MyApp;
