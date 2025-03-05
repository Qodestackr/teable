import { useQuery } from '@tanstack/react-query';
import type { IFieldVo, IRecord, IViewVo } from '@teable/core';
import { getBaseById, type IGroupPointsVo } from '@teable/openapi';
import {
  AnchorContext,
  FieldProvider,
  useTable,
  useUndoRedo,
  ViewProvider,
  PersonalViewProxy,
  PersonalViewProvider,
  ReactQueryKeys,
} from '@teable/sdk';
import { TablePermissionProvider } from '@teable/sdk/context/table-permission';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ErrorBoundary } from 'react-error-boundary';
import { useHotkeys } from 'react-hotkeys-hook';
import { PluginContextMenu } from '../../components/plugin-context-menu/PluginContextMenu';
import { PluginPanel } from '../../components/plugin-panel/PluginPanel';
import { View } from '../view/View';
import { FailAlert } from './FailAlert';
import { useViewErrorHandler } from './hooks/use-view-error-handler';
import { TableHeader } from './table-header/TableHeader';

export interface ITableProps {
  fieldServerData: IFieldVo[];
  viewServerData: IViewVo[];
  recordsServerData: { records: IRecord[] };
  recordServerData?: IRecord;
  groupPointsServerDataMap?: { [viewId: string]: IGroupPointsVo | undefined };
}

export const Table: React.FC<ITableProps> = ({
  fieldServerData,
  viewServerData,
  recordsServerData,
  recordServerData,
  groupPointsServerDataMap,
}) => {
  const table = useTable();
  const router = useRouter();
  const { undo, redo } = useUndoRedo();
  const { baseId, tableId, viewId } = router.query as {
    tableId: string;
    viewId: string;
    baseId: string;
  };
  const { data: base } = useQuery({
    queryKey: ReactQueryKeys.base(baseId as string),
    queryFn: ({ queryKey }) => getBaseById(queryKey[1]).then((res) => res.data),
  });

  useViewErrorHandler(baseId, tableId, viewId);
  useHotkeys(`mod+z`, () => undo(), {
    preventDefault: true,
  });

  useHotkeys([`mod+shift+z`, `mod+y`], () => redo(), {
    preventDefault: true,
  });

  return (
    <AnchorContext.Provider value={{ tableId, viewId, baseId }}>
      <Head>
        <title>
          {table?.name
            ? `${table?.icon ? table.icon + ' ' : ''}${table.name}: ${base?.name} - Teable`
            : 'Teable'}
        </title>
        <style data-fullcalendar></style>
      </Head>
      <TablePermissionProvider baseId={baseId}>
        <ViewProvider serverData={viewServerData}>
          <PersonalViewProxy serverData={viewServerData}>
            <div className="flex h-full grow basis-[500px]">
              <div className="flex flex-1 flex-col overflow-hidden">
                <TableHeader />
                <FieldProvider serverSideData={fieldServerData}>
                  <ErrorBoundary
                    fallback={
                      <div className="flex size-full items-center justify-center">
                        <FailAlert />
                      </div>
                    }
                  >
                    <PersonalViewProvider>
                      <View
                        recordServerData={recordServerData}
                        recordsServerData={recordsServerData}
                        groupPointsServerDataMap={groupPointsServerDataMap}
                      />
                    </PersonalViewProvider>
                  </ErrorBoundary>
                </FieldProvider>
              </div>
              <PluginPanel tableId={tableId} />
              <PluginContextMenu tableId={tableId} baseId={baseId} />
            </div>
          </PersonalViewProxy>
        </ViewProvider>
      </TablePermissionProvider>
    </AnchorContext.Provider>
  );
};
