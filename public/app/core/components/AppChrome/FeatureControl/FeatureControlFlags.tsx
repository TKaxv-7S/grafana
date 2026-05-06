import { css, cx } from '@emotion/css';
import { ClientProviderEvents } from '@openfeature/web-sdk';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';

import type { GrafanaTheme2, IconName } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { getLocalStorageProvider } from '@grafana/runtime/internal';
import { Card, Dropdown, Icon, IconButton, Menu, MenuGroup, MenuItem, Stack, Text, useStyles2 } from '@grafana/ui';

import { FeatureControlFlag, type FeatureControlFlagProps } from './FeatureControlFlag';
import { type FeatureControlCorner, useFeatureControlContext } from './FeatureControlProvider';

const compare = new Intl.Collator('en', { sensitivity: 'base', numeric: true }).compare;

type Flag = NonNullable<FeatureControlFlagProps['flag']>;

type FeatureControlFlagsProps = {
  className?: string;
  style?: CSSProperties;
};

export const FeatureControlFlags = ({ className, style }: FeatureControlFlagsProps) => {
  const { setIsOpen, setIsAccessible, corner, setCorner } = useFeatureControlContext();
  const [flags, setFlags] = useState<Flag[]>([]);
  const styles = useStyles2(getStyles);

  useEffect(() => {
    const loadFlags = () => {
      setFlags(
        Object.entries(getLocalStorageProvider().getFlags())
          .map(([key, value]) => ({ key, value }))
          .sort((a, b) => compare(a.key, b.key))
      );
    };
    loadFlags();

    getLocalStorageProvider().events.addHandler(ClientProviderEvents.ConfigurationChanged, loadFlags);
    return () => {
      getLocalStorageProvider().events.removeHandler(ClientProviderEvents.ConfigurationChanged, loadFlags);
    };
  }, []);

  const menu = useMemo(() => {
    const corners: Array<{ value: FeatureControlCorner; label: string; icon: IconName; transform: string }> = [
      {
        value: 'top-left',
        label: t('feature-control.position.top-left', 'Top left'),
        icon: 'arrow-up',
        transform: 'rotate(-45deg)',
      },
      {
        value: 'top-right',
        label: t('feature-control.position.top-right', 'Top right'),
        icon: 'arrow-up',
        transform: 'rotate(45deg)',
      },
      {
        value: 'bottom-left',
        label: t('feature-control.position.bottom-left', 'Bottom left'),
        icon: 'arrow-down',
        transform: 'rotate(45deg)',
      },
      {
        value: 'bottom-right',
        label: t('feature-control.position.bottom-right', 'Bottom right'),
        icon: 'arrow-down',
        transform: 'rotate(-45deg)',
      },
    ];

    return (
      <Menu>
        <MenuGroup label={t('feature-control.position.header', 'Position')}>
          {corners.map((item) => (
            <MenuItem
              key={item.value}
              active={item.value === corner}
              ariaChecked={item.value === corner}
              onClick={() => setCorner(item.value)}
              label=""
              component={() => (
                <Stack direction="row" alignItems="center">
                  <Icon name={item.icon} style={{ transform: item.transform }} />
                  <Text color="primary">{item.label}</Text>
                </Stack>
              )}
            />
          ))}
        </MenuGroup>

        <MenuGroup label={t('feature-control.dismiss.header', 'Dismiss')}>
          <MenuItem
            onClick={() => {
              setIsOpen(false);
              setIsAccessible(false);
            }}
            destructive
            icon="times"
            label={t('feature-control.dismiss.label', 'Remove UI and toolbar button')}
            component={() => (
              <Text color="secondary" variant="bodySmall" textAlignment="start">
                <Trans i18nKey="feature-control.dismiss.tooltip" values={{ param: '?featureControl=true' }}>
                  Any feature flag overrides defined will remain active.
                  <br /> Use <code>{'{{ param }}'}</code> in the URL to enable UI again.
                </Trans>
              </Text>
            )}
          />
        </MenuGroup>
      </Menu>
    );
  }, [corner, setCorner, setIsOpen, setIsAccessible]);

  return (
    <Card noMargin className={cx(styles.card, className)} style={style}>
      <div className={styles.header}>
        <Stack direction="row" alignItems="center">
          <Icon name="flask" size="xl" />
          <Text variant="h4">
            <Trans i18nKey="feature-control.title">Feature control</Trans>
          </Text>

          <Dropdown overlay={menu} placement="bottom-start">
            <IconButton
              tooltip={t('feature-control.menu', 'Open menu')}
              variant="secondary"
              name="bars"
              className={styles.menu}
            />
          </Dropdown>
        </Stack>
        <Text variant="body" color="secondary">
          <Trans i18nKey="feature-control.description">
            Override frontend feature flags locally for testing and development purposes.
          </Trans>
        </Text>
      </div>

      <div className={styles.list}>
        {flags.map((flag) => (
          <FeatureControlFlag key={flag.key} flag={flag} />
        ))}
        <FeatureControlFlag />
      </div>
    </Card>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  card: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    boxShadow: theme.shadows.z2,
    border: `1px solid ${theme.colors.border.medium}`,
  }),
  header: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  menu: css({
    marginLeft: 'auto',
  }),
  list: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    margin: theme.spacing(0, 0, 1),
    width: '100%',
  }),
});
