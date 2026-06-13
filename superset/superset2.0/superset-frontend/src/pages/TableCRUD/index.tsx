/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { styled, SupersetClient, t } from '@superset-ui/core';
import { useState, useEffect } from 'react';
import { Select, Input, Button, Modal, Form, Space, Popconfirm, Table as AntdTable } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import withToasts from 'src/components/MessageToasts/withToasts';
import SubMenu, { SubMenuProps } from 'src/features/home/SubMenu';

const { Option } = Select;

interface TableCRUDProps {
  addDangerToast: (msg: string) => void;
  addSuccessToast: (msg: string) => void;
}

interface Database {
  id: number;
  database_name: string;
}

interface Schema {
  name: string;
}

interface TableData {
  [key: string]: any;
}

const PageContainer = styled.div`
  padding: ${({ theme }: any) => theme.gridUnit * 4}px;
  background-color: ${({ theme }: any) => theme.colors.grayscale.light4};
  min-height: calc(100vh - 50px);
`;

const SelectorsContainer = styled.div`
  background: white;
  padding: ${({ theme }: any) => theme.gridUnit * 4}px;
  border-radius: ${({ theme }: any) => theme.borderRadius}px;
  margin-bottom: ${({ theme }: any) => theme.gridUnit * 4}px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const TableContainer = styled.div`
  background: white;
  padding: ${({ theme }: any) => theme.gridUnit * 4}px;
  border-radius: ${({ theme }: any) => theme.borderRadius}px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const StyledSelect = styled(Select)`
  width: 250px;
  margin-right: ${({ theme }: any) => theme.gridUnit * 2}px;
`;

const ActionButtons = styled.div`
  margin-bottom: ${({ theme }: any) => theme.gridUnit * 3}px;
`;

function TableCRUD({ addDangerToast, addSuccessToast }: TableCRUDProps) {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  
  const [selectedDatabase, setSelectedDatabase] = useState<number | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [tableColumns, setTableColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'insert'>('create');
  const [editingRecord, setEditingRecord] = useState<TableData | null>(null);
  
  const [form] = Form.useForm();

  // Fetch databases on mount
  useEffect(() => {
    fetchDatabases();
  }, []);

  // Fetch schemas when database is selected
  useEffect(() => {
    if (selectedDatabase) {
      fetchSchemas(selectedDatabase);
      setSelectedSchema(null);
      setSelectedTable(null);
      setTableData([]);
    }
  }, [selectedDatabase]);

  // Fetch tables when schema is selected
  useEffect(() => {
    if (selectedDatabase && selectedSchema) {
      fetchTables(selectedDatabase, selectedSchema);
      setSelectedTable(null);
      setTableData([]);
    }
  }, [selectedSchema]);

  // Fetch table data when table is selected
  useEffect(() => {
    if (selectedDatabase && selectedSchema && selectedTable) {
      fetchTableData();
    }
  }, [selectedTable]);

  const fetchDatabases = async () => {
    try {
      const response = await SupersetClient.get({
        endpoint: '/api/v1/database/',
      });
      setDatabases(response.json.result || []);
    } catch (error) {
      addDangerToast(t('Failed to fetch databases'));
    }
  };

  const fetchSchemas = async (databaseId: number) => {
    try {
      const response = await SupersetClient.get({
        endpoint: `/api/v1/database/${databaseId}/schemas/`,
      });
      const schemaList = response.json.result || [];
      setSchemas(schemaList.map((name: string) => ({ name })));
    } catch (error) {
      addDangerToast(t('Failed to fetch schemas'));
    }
  };

  const fetchTables = async (databaseId: number, schema: string) => {
    try {
      const params = new URLSearchParams({ 
        schema_name: schema,
      });
      const response = await SupersetClient.get({
        endpoint: `/api/v1/database/${databaseId}/tables/?${params.toString()}`,
      });
      const tableList = response.json.result || [];
      setTables(tableList.map((item: any) => item.value || item.name || item));
    } catch (error) {
      addDangerToast(t('Failed to fetch tables'));
    }
  };

  const fetchTableData = async () => {
    if (!selectedDatabase || !selectedSchema || !selectedTable) return;
    
    setLoading(true);
    try {
      // Execute a SQL query to fetch table data
      const sql = `SELECT * FROM ${selectedSchema}.${selectedTable} LIMIT 100`;
      
      const response = await SupersetClient.post({
        endpoint: '/api/v1/sqllab/execute/',
        jsonPayload: {
          database_id: selectedDatabase,
          sql,
          schema: selectedSchema,
        },
      });

      const { data, columns } = response.json;
      
      // Transform columns for Ant Design Table
      const transformedColumns = columns.map((col: any, index: number) => ({
        title: col.column_name || col.name || `Column ${index + 1}`,
        dataIndex: col.column_name || col.name || `col_${index}`,
        key: col.column_name || col.name || `col_${index}`,
        ellipsis: true,
      }));
      
      // Add Actions column
      transformedColumns.push({
        title: 'Actions',
        key: 'actions',
        fixed: 'right',
        width: 150,
        render: (_: any, record: TableData, index: number) => (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
            <Popconfirm
              title="Are you sure you want to delete this row?"
              onConfirm={() => handleDelete(record, index)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
            <Button
              type="link"
              onClick={() => handleInsertAfter(index)}
            >
              Insert After
            </Button>
          </Space>
        ),
      });

      setTableColumns(transformedColumns);
      setTableData(data.map((row: any, index: number) => ({ ...row, key: index })));
      addSuccessToast(t('Table data loaded successfully'));
    } catch (error: any) {
      addDangerToast(t('Failed to fetch table data: %s', error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: TableData) => {
    setModalMode('edit');
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleInsertAfter = (index: number) => {
    setModalMode('insert');
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleDelete = async (record: TableData, index: number) => {
    if (!selectedDatabase || !selectedSchema || !selectedTable) return;

    try {
      // Build WHERE clause from the record
      const whereConditions = Object.entries(record)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          if (value === null) return `${key} IS NULL`;
          if (typeof value === 'string') return `${key} = '${value.replace(/'/g, "''")}'`;
          return `${key} = ${value}`;
        })
        .join(' AND ');

      const sql = `DELETE FROM ${selectedSchema}.${selectedTable} WHERE ${whereConditions}`;
      
      await SupersetClient.post({
        endpoint: '/api/v1/sqllab/execute/',
        jsonPayload: {
          database_id: selectedDatabase,
          sql,
          schema: selectedSchema,
        },
      });

      addSuccessToast(t('Row deleted successfully'));
      fetchTableData();
    } catch (error: any) {
      addDangerToast(t('Failed to delete row: %s', error?.message || 'Unknown error'));
    }
  };

  const handleModalOk = async () => {
    if (!selectedDatabase || !selectedSchema || !selectedTable) return;

    try {
      const values = await form.validateFields();
      
      let sql = '';
      
      if (modalMode === 'create' || modalMode === 'insert') {
        // INSERT query
        const columns = Object.keys(values).join(', ');
        const valuesStr = Object.values(values)
          .map(v => {
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            return v;
          })
          .join(', ');
        
        sql = `INSERT INTO ${selectedSchema}.${selectedTable} (${columns}) VALUES (${valuesStr})`;
      } else if (modalMode === 'edit' && editingRecord) {
        // UPDATE query
        const setClause = Object.entries(values)
          .map(([key, value]) => {
            if (value === null || value === undefined) return `${key} = NULL`;
            if (typeof value === 'string') return `${key} = '${value.replace(/'/g, "''")}'`;
            return `${key} = ${value}`;
          })
          .join(', ');
        
        const whereConditions = Object.entries(editingRecord)
          .filter(([key]) => key !== 'key')
          .map(([key, value]) => {
            if (value === null) return `${key} IS NULL`;
            if (typeof value === 'string') return `${key} = '${value.replace(/'/g, "''")}'`;
            return `${key} = ${value}`;
          })
          .join(' AND ');
        
        sql = `UPDATE ${selectedSchema}.${selectedTable} SET ${setClause} WHERE ${whereConditions}`;
      }

      await SupersetClient.post({
        endpoint: '/api/v1/sqllab/execute/',
        jsonPayload: {
          database_id: selectedDatabase,
          sql,
          schema: selectedSchema,
        },
      });

      addSuccessToast(t('Operation completed successfully'));
      setIsModalVisible(false);
      form.resetFields();
      fetchTableData();
    } catch (error: any) {
      addDangerToast(t('Operation failed: %s', error?.message || 'Unknown error'));
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const menuData: SubMenuProps = {
    activeChild: 'CRUD',
    name: t('Table CRUD Operations'),
  };

  const getModalTitle = () => {
    if (modalMode === 'create') return 'Create New Row';
    if (modalMode === 'edit') return 'Edit Row';
    return 'Insert Row';
  };

  return (
    <>
      <SubMenu {...menuData} />
      <PageContainer>
        <SelectorsContainer>
          <Space size="large">
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                {t('Database')}
              </label>
              <StyledSelect
                placeholder={t('Select a database')}
                value={selectedDatabase}
                onChange={setSelectedDatabase}
                showSearch
                filterOption={(input: string, option: any) =>
                  (option?.children as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {databases.map(db => (
                  <Option key={db.id} value={db.id}>
                    {db.database_name}
                  </Option>
                ))}
              </StyledSelect>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                {t('Schema')}
              </label>
              <StyledSelect
                placeholder={t('Select a schema')}
                value={selectedSchema}
                onChange={setSelectedSchema}
                disabled={!selectedDatabase}
                showSearch
                filterOption={(input: string, option: any) =>
                  (option?.children as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {schemas.map(schema => (
                  <Option key={schema.name} value={schema.name}>
                    {schema.name}
                  </Option>
                ))}
              </StyledSelect>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                {t('Table')}
              </label>
              <StyledSelect
                placeholder={t('Select a table')}
                value={selectedTable}
                onChange={setSelectedTable}
                disabled={!selectedSchema}
                showSearch
                filterOption={(input: string, option: any) =>
                  (option?.children as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {tables.map(table => (
                  <Option key={table} value={table}>
                    {table}
                  </Option>
                ))}
              </StyledSelect>
            </div>
          </Space>
        </SelectorsContainer>

        {selectedTable && (
          <TableContainer>
            <ActionButtons>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                {t('Create New Row')}
              </Button>
            </ActionButtons>

            <AntdTable
              columns={tableColumns}
              dataSource={tableData}
              loading={loading}
              scroll={{ x: 'max-content' }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} rows`,
              }}
            />
          </TableContainer>
        )}

        <Modal
          title={getModalTitle()}
          visible={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={600}
          okText={modalMode === 'edit' ? 'Update' : 'Create'}
        >
          <Form form={form} layout="vertical">
            {tableColumns
              .filter(col => col.key !== 'actions' && col.key !== 'key')
              .map(col => (
                <Form.Item
                  key={col.key}
                  name={col.dataIndex}
                  label={col.title}
                >
                  <Input placeholder={`Enter ${col.title}`} />
                </Form.Item>
              ))}
          </Form>
        </Modal>
      </PageContainer>
    </>
  );
}

export default withToasts(TableCRUD);

