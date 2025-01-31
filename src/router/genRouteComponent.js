import React from 'react';
import WithTitleRoute from './withTitle';
import { Route, Redirect } from 'react-router-dom';
import Loadable from 'react-loadable';

const getComponent = component =>
  Loadable({
    loader: component,
    loading: () => null,
  });

export default () => {
  const components = [];
  return (ROUTE_CONFIG, exceptRoute) => {
    /**
     * 缓存生成的路由组件
     */
    if (components.length > 0) return components;
    _.keys(_.omit(ROUTE_CONFIG, exceptRoute)).forEach((key, i) => {
      const { component, redirect, ...rest } = ROUTE_CONFIG[key];

      if (redirect) {
        components.push(<Route key={i} {...rest} render={() => <Redirect to={redirect} />} />);
      } else {
        components.push(<WithTitleRoute key={i} component={getComponent(component)} {...rest} />);
      }
    });
    return components;
  };
};
