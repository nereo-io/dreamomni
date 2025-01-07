import {
  createCustomer,
  getCustomerById,
  getCustomerBaziInfo,
  saveBaziAnalysis,
  getBaziAnalysis,
  getCustomersByUserUuid
} from '../customer';
import { getSupabaseClient } from '../db';

// 确保测试环境变量已加载
import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });

describe('Customer Model Tests', () => {
  // 用于存储测试过程中创建的客户ID
  let testCustomerId: string;
  const testUserUuid = 'test-user-uuid-' + Date.now();

  // 测试数据
  const testCustomerData = {
    name: '测试用户',
    gender: 'male' as const,
    birth_date_time: '2024-03-15T08:00:00Z',
    true_solar_time: '2024-03-15T08:00:00Z',
    birth_city: '北京',
    city_adcode: '110000',
    city_address: '北京市',
    city_lng: '116.4074',
    city_lat: '39.9042',
    user_uuid: '785a4c2e-5ccc-4c50-9160-7bfc4e98bbfc',
    timezone: 'Asia/Shanghai',
  };

  // 创建客户测试
  test('should create a new customer', async () => {
    const customer = await createCustomer(testCustomerData);
    expect(customer).toBeTruthy();
    expect(customer.name).toBe(testCustomerData.name);
    expect(customer.user_uuid).toBe(testCustomerData.user_uuid);
    
    // 保存客户ID用于后续测试
    testCustomerId = customer.id;
  });

  // 获取客户信息测试
  test('should get customer by id', async () => {
    const customer = await getCustomerById(testCustomerId);
    expect(customer).toBeTruthy();
    expect(customer?.name).toBe(testCustomerData.name);
  });

  // 测试获取八字分析所需信息
  test('should get bazi info', async () => {
    const baziInfo = await getCustomerBaziInfo(testCustomerId);
    expect(baziInfo).toBeTruthy();
    expect(baziInfo.gender).toBe(testCustomerData.gender);
  });

  // 测试保存和获取八字分析结果
  test('should save and get bazi analysis', async () => {
    try {
      const testAnalysis = '这是一个测试的八字分析结果';
      
      // 确保 testCustomerId 存在
      expect(testCustomerId).toBeDefined();
      console.log('Testing with customer ID:', testCustomerId);
      
      // 保存分析结果
      const savedAnalysis = await saveBaziAnalysis(testCustomerId, testAnalysis);
      console.log('Saved analysis result:', savedAnalysis);
      expect(savedAnalysis).toBeTruthy();
      
      // 获取分析结果
      const retrievedAnalysis = await getBaziAnalysis(testCustomerId);
      console.log('Retrieved analysis result:', retrievedAnalysis);
      expect(retrievedAnalysis).toBeTruthy();
      expect(retrievedAnalysis?.bazi_result).toBe(testAnalysis);
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error;
    }
  });

  // 清理测试数据
  afterAll(async () => {
    const supabase = getSupabaseClient();
    
    // 删除测试创建的客户分析数据
    await supabase
      .from('customer_analysis')
      .delete()
      .eq('customer_id', testCustomerId);
    
    // 删除测试创建的客户数据
    await supabase
      .from('customer_inputs')
      .delete()
      .eq('id', testCustomerId);
  });
});