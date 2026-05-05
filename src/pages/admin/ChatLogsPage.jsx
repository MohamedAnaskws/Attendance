// D:\Projects\full updated frontend\src\pages\admin\ChatLogsPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Table,
  Typography,
  Space,
  Input,
  Select,
  DatePicker,
  Button,
  Tag,
  Modal,
  Tooltip,
  Divider,
  Badge,
  message,
  Collapse,
  Timeline,
  Avatar,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  MessageOutlined,
  FileTextOutlined,
  PictureOutlined,
  FileOutlined,
  RobotOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import MainLayout from '../../components/layout/MainLayout';
import { getUser, getToken } from '../../utils/auth';
import {
  getChatMessages,
  getChatConversations,
  getChatUsers,
  getChatStatistics,
} from '../../services/chatLogsApi';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const ChatLogsPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total: 0,
    total_pages: 0,
  });
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedDayMessages, setSelectedDayMessages] = useState([]);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');

  // Filters
  const [selectedConversationId, setSelectedConversationId] = useState(undefined);
  const [selectedUserId, setSelectedUserId] = useState(undefined);
  const [searchText, setSearchText] = useState('');
  const [selectedMessageType, setSelectedMessageType] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const currentUser = getUser();
  const isOwner = currentUser?.roleid === 1;

  // Check permission
  if (!isOwner) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="text-center">
            <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ef4444', marginBottom: 16 }} />
            <Title level={4}>Access Denied</Title>
            <Text type="secondary">
              Chat logs are only available for OWNER role users.
            </Text>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Group messages by day
  const groupMessagesByDay = (messagesList) => {
    const grouped = {};
    messagesList.forEach((msg) => {
      const day = dayjs(msg.created_at).format('YYYY-MM-DD');
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(msg);
    });
    return grouped;
  };

  // Convert grouped messages to table data
  const tableData = useMemo(() => {
    const grouped = groupMessagesByDay(messages);
    return Object.keys(grouped).map((day) => ({
      key: day,
      date: day,
      messages: grouped[day],
      messageCount: grouped[day].length,
      formattedDate: dayjs(day).format('dddd, MMMM DD, YYYY'),
    }));
  }, [messages]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await getChatStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load conversations for filter dropdown
  const loadConversations = useCallback(async () => {
    try {
      const response = await getChatConversations();
      if (response.success) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  // Load users for filter dropdown
  const loadUsers = useCallback(async () => {
    try {
      const response = await getChatUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  // Load messages with filters
  const loadMessages = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await getChatMessages({
        page,
        per_page: pagination.per_page,
        conversation_id: selectedConversationId,
        user_id: selectedUserId,
        search: searchText || undefined,
        message_type: selectedMessageType,
        from_date: dateRange?.[0]?.format('YYYY-MM-DD'),
        to_date: dateRange?.[1]?.format('YYYY-MM-DD'),
        include_deleted: includeDeleted,
      });

      if (response.success) {
        setMessages(response.data);
        setPagination({
          page: response.pagination.page,
          per_page: response.pagination.per_page,
          total: response.pagination.total,
          total_pages: response.pagination.total_pages,
        });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      message.error('Failed to load chat messages');
    } finally {
      setLoading(false);
    }
  }, [selectedConversationId, selectedUserId, searchText, selectedMessageType, dateRange, includeDeleted, pagination.per_page]);

  // Initial load
  useEffect(() => {
    loadStatistics();
    loadConversations();
    loadUsers();
  }, []);

  useEffect(() => {
    loadMessages(1);
  }, [selectedConversationId, selectedUserId, searchText, selectedMessageType, dateRange, includeDeleted]);

  const handleResetFilters = () => {
    setSelectedConversationId(undefined);
    setSelectedUserId(undefined);
    setSearchText('');
    setSelectedMessageType(undefined);
    setDateRange(null);
    setIncludeDeleted(false);
  };

  const handleViewDayMessages = (day, messagesList) => {
    setSelectedDay(day);
    setSelectedDayMessages(messagesList);
    setDayModalOpen(true);
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'TEXT':
        return <FileTextOutlined style={{ color: '#3b82f6' }} />;
      case 'IMAGE':
        return <PictureOutlined style={{ color: '#10b981' }} />;
      case 'FILE':
        return <FileOutlined style={{ color: '#f59e0b' }} />;
      case 'SYSTEM':
        return <RobotOutlined style={{ color: '#8b5cf6' }} />;
      default:
        return <MessageOutlined />;
    }
  };

  const getMessageTypeTag = (type) => {
    const config = {
      TEXT: { color: 'blue', label: 'Text' },
      IMAGE: { color: 'green', label: 'Image' },
      FILE: { color: 'orange', label: 'File' },
      SYSTEM: { color: 'purple', label: 'System' },
    };
    const { color, label } = config[type] || { color: 'default', label: type };
    return <Tag color={color}>{label}</Tag>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dayjs(dateStr).format('DD MMM YYYY, HH:mm:ss');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return dayjs(dateStr).format('HH:mm:ss');
  };

  // Table columns for grouped by day
  const columns = [
    {
      title: 'Date',
      dataIndex: 'formattedDate',
      width: 200,
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      defaultSortOrder: 'descend',
      render: (text, record) => (
        <div>
          <div className="font-semibold">{text}</div>
          <Text type="secondary" className="text-xs">
            {record.date}
          </Text>
        </div>
      ),
    },
    {
      title: 'Message Summary',
      dataIndex: 'messages',
      render: (messages, record) => {
        const latestMessage = messages[messages.length - 1];
        const uniqueSenders = [...new Set(messages.map(m => m.sender?.username || 'System'))];
        const messageTypes = [...new Set(messages.map(m => m.message_type))];
        
        return (
          <div>
            <Space wrap size="small" className="mb-2">
              <Tag color="blue">{record.messageCount} messages</Tag>
              <Tag color="cyan">{uniqueSenders.length} sender(s)</Tag>
              {messageTypes.map(type => (
                <Tag key={type} color="geekblue">{type}</Tag>
              ))}
            </Space>
            <div className="text-gray-600">
              <Text type="secondary" className="text-xs">Latest: </Text>
              <Text>
                {latestMessage.message_text && latestMessage.message_text.length > 80 
                  ? `${latestMessage.message_text.substring(0, 80)}...` 
                  : latestMessage.message_text || '(No text)'}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Total Messages',
      dataIndex: 'messageCount',
      width: 120,
      align: 'center',
      sorter: (a, b) => a.messageCount - b.messageCount,
      render: (count) => (
        <Badge count={count} showZero style={{ backgroundColor: '#1890ff' }} />
      ),
    },
    {
      title: 'Actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Tooltip title={`View all ${record.messageCount} messages from ${record.formattedDate}`}>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewDayMessages(record.date, record.messages)}
          >
            View Day
          </Button>
        </Tooltip>
      ),
    },
  ];

  // Sort messages by time for timeline view
  const sortedDayMessages = [...selectedDayMessages].sort((a, b) => 
    dayjs(a.created_at).unix() - dayjs(b.created_at).unix()
  );

  return (
    <MainLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <Title level={3} className="m-0 flex items-center gap-2">
            Chat Logs
          </Title>
          <Divider className="my-4" />
        </div>

        {/* Filters */}
        <Card className="rounded-xl shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select
                placeholder="Filter by Conversation"
                allowClear
                showSearch
                optionFilterProp="children"
                value={selectedConversationId}
                onChange={setSelectedConversationId}
                className="w-full"
              >
                {conversations.map((conv) => (
                  <Option key={conv.id} value={conv.id}>
                    {conv.conversation_type === 'GROUP'
                      ? `${conv.group_name} (Group)`
                      : `Conversation ${conv.id}`}
                    {' - '}
                    {conv.message_count} msgs
                  </Option>
                ))}
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Select
                placeholder="Filter by User"
                allowClear
                showSearch
                optionFilterProp="children"
                value={selectedUserId}
                onChange={setSelectedUserId}
                className="w-full"
              >
                {users.map((user) => (
                  <Option key={user.id} value={user.id}>
                    {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username}
                    {' - '}
                    {user.message_count} msgs
                  </Option>
                ))}
              </Select>
            </div>

            <div className="flex-1 min-w-[250px]">
              <RangePicker
                className="w-full"
                placeholder={['From Date', 'To Date']}
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            <Input
              placeholder="Search in message text..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 min-w-[250px]"
              allowClear
            />

            <Select
              placeholder="Message Type"
              allowClear
              value={selectedMessageType}
              onChange={setSelectedMessageType}
              className="w-32"
            >
              <Option value="TEXT">Text</Option>
              <Option value="IMAGE">Image</Option>
              <Option value="FILE">File</Option>
              <Option value="SYSTEM">System</Option>
            </Select>

            <Button onClick={handleResetFilters}>Reset Filters</Button>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => loadMessages(1)}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </Card>

        {/* Messages Table (Grouped by Day) */}
        <Card className="rounded-xl shadow-sm">
          <Table
            columns={columns}
            dataSource={tableData}
            rowKey="key"
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.per_page,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} days with messages`,
              onChange: (page, pageSize) => {
                setPagination(prev => ({ ...prev, page, per_page: pageSize || 50 }));
                loadMessages(page);
              },
            }}
            scroll={{ x: 800 }}
            size="middle"
          />
        </Card>

        {/* Day Messages Modal - Timeline View */}
        <Modal
          title={
            <Space>
              <MessageOutlined />
              <span>Messages from {dayjs(selectedDay).format('dddd, MMMM DD, YYYY')}</span>
              <Tag color="blue">{selectedDayMessages.length} messages</Tag>
            </Space>
          }
          open={dayModalOpen}
          onCancel={() => setDayModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDayModalOpen(false)}>
              Close
            </Button>,
          ]}
          width={900}
          bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
          <Timeline mode="left" className="mt-4">
            {sortedDayMessages.map((msg, index) => (
              <Timeline.Item
                key={msg.id}
                label={
                  <div className="text-right">
                    <Text strong className="text-xs">
                      {formatTime(msg.created_at)}
                    </Text>
                  </div>
                }
                dot={
                  msg.message_type === 'SYSTEM' ? 
                    <RobotOutlined style={{ fontSize: '16px', color: '#8b5cf6' }} /> :
                    <UserOutlined style={{ fontSize: '16px', color: '#3b82f6' }} />
                }
                color={
                  msg.message_type === 'SYSTEM' ? 'purple' :
                  msg.is_deleted ? 'red' : 'blue'
                }
              >
                <Card 
                  size="small" 
                  className="rounded-lg"
                  style={{ 
                    backgroundColor: msg.is_deleted ? '#fff1f0' : '#fafafa',
                    borderLeft: `3px solid ${msg.message_type === 'SYSTEM' ? '#8b5cf6' : '#3b82f6'}`
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Space>
                      <Avatar 
                        size="small" 
                        src={msg.sender?.profile_image}
                        icon={!msg.sender?.profile_image && <UserOutlined />}
                      />
                      <Text strong>
                        {msg.sender ? (
                          <>
                            {msg.sender.first_name 
                              ? `${msg.sender.first_name} ${msg.sender.last_name || ''}`.trim()
                              : msg.sender.username}
                          </>
                        ) : (
                          'System'
                        )}
                      </Text>
                      {msg.sender && (
                        <Text type="secondary" className="text-xs">
                          @{msg.sender.username}
                        </Text>
                      )}
                    </Space>
                    {getMessageTypeTag(msg.message_type)}
                  </div>

                  {msg.is_deleted ? (
                    <Text type="secondary" delete>
                      [Deleted message]
                    </Text>
                  ) : (
                    <>
                      {msg.message_type === 'IMAGE' ? (
                        <div>
                          <PictureOutlined className="text-green-500 mr-2" />
                          <Text>Image: {msg.file_name || 'photo'}</Text>
                          {msg.file_url && (
                            <div className="mt-2">
                              <a
                                href={`${import.meta.env.VITE_API_URL}/api/${msg.file_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500"
                              >
                                View Image
                              </a>
                            </div>
                          )}
                        </div>
                      ) : msg.message_type === 'FILE' ? (
                        <div>
                          <FileOutlined className="text-orange-500 mr-2" />
                          <Text>File: {msg.file_name}</Text>
                          {msg.file_size && (
                            <Text type="secondary" className="text-xs ml-2">
                              ({(msg.file_size / 1024).toFixed(1)} KB)
                            </Text>
                          )}
                          {msg.file_url && (
                            <div className="mt-2">
                              <a
                                href={`${import.meta.env.VITE_API_URL}/api/${msg.file_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500"
                              >
                                Download File
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Paragraph className="mb-0 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>
                          {msg.message_text || '(No text content)'}
                        </Paragraph>
                      )}
                    </>
                  )}

                  {msg.is_edited && (
                    <Tag color="orange" className="text-xs mt-2">
                      Edited {msg.edit_count} time{msg.edit_count !== 1 ? 's' : ''}
                    </Tag>
                  )}

                  {msg.reply_to_id && (
                    <div className="mt-2">
                      <Text type="secondary" className="text-xs">
                        ↳ Reply to message #{msg.reply_to_id}
                      </Text>
                    </div>
                  )}
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        </Modal>
      </div>
    </MainLayout>
  );
};

// Simple Statistic component
const Statistic = ({ title, value }) => (
  <div>
    <Text type="secondary" className="text-sm">{title}</Text>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </div>
);

export default ChatLogsPage;