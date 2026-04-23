import { css, cx } from '@emotion/css';
import { ClientProviderEvents } from '@openfeature/web-sdk';
import { type PointerEventHandler, useEffect, useState } from 'react';

import type { GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { getLocalStorageProvider } from '@grafana/runtime/internal';
import { Button, Card, Icon, Stack, Text, useStyles2 } from '@grafana/ui';

import { FeatureControlFlag, type FeatureControlFlagProps } from './FeatureControlFlag';
import { useFeatureControlContext } from './FeatureControlProvider';

const compare = new Intl.Collator('en', { sensitivity: 'base', numeric: true }).compare;

type Flag = NonNullable<FeatureControlFlagProps['flag']>;

type FeatureControlFlagsProps = {
  className?: string;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
};

export const FeatureControlFlags = ({ className, onPointerDown }: FeatureControlFlagsProps) => {
  const { setIsOpen, setIsAccessible } = useFeatureControlContext();
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

  return (
    <Card noMargin className={cx(styles.card, className)} onPointerDown={onPointerDown}>
      <div className={styles.header}>
        <Stack direction="row" alignItems="center">
          <Icon name="flask" size="xl" />
          <Text variant="h4">
            <Trans i18nKey="feature-control.title">Feature control</Trans>
          </Text>
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

      <Button
        size="sm"
        variant="destructive"
        fill="outline"
        fullWidth
        onClick={() => {
          setIsOpen(false);
          setIsAccessible(false);
        }}
        tooltip={
          <Trans i18nKey="feature-control.dismiss-tooltip" values={{ param: '?featureControl=true' }}>
            Removes the feature control UI and toolbar button. Use <code>{'{{ param }}'}</code> in the URL to enable it
            again. Any overrides defined will remain active.
          </Trans>
        }
      >
        <Trans i18nKey="feature-control.dismiss">Dismiss feature control</Trans>
      </Button>
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
    pointerEvents: 'none',
  }),
  list: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    margin: theme.spacing(0, 0, 1),
    width: '100%',
  }),
});
