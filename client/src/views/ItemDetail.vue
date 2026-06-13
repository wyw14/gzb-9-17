<template>
  <div v-if="loading" style="text-align:center;padding:60px;color:white;">
    加载中...
  </div>

  <div v-else-if="!item" class="empty-state card">
    <h2>物品不存在</h2>
    <router-link to="/">
      <button class="btn btn-primary">返回首页</button>
    </router-link>
  </div>

  <div v-else class="card" style="max-width:900px;margin:0 auto;">
    <div class="grid grid-2">
      <div>
        <div style="width:100%;aspect-ratio:1;border-radius:12px;overflow:hidden;background:#f0f0f0;">
          <img
            :src="appendAuth(item.image)"
            alt="物品图片"
            style="width:100%;height:100%;object-fit:cover;"/>
        </div>
        <div v-if="!item.revealInfo" style="margin-top:12px;text-align:center;color:#666;font-size:13px;">
          图片模糊处理中，交换成功后显示原图
        </div>
      </div>

      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
          <div>
            <span :class="item.status === 'available' ? 'badge badge-available' : 'badge badge-exchanged'"
                  style="margin-bottom:8px;display:inline-block;">
              {{ item.status === 'available' ? '可交换' : '已交换' }}
            </span>
            <h2 style="font-size:24px;">
              {{ item.revealInfo ? item.realName : getCategoryName(item.category) }}
            </h2>
          </div>
          <router-link to="/">
            <button class="btn btn-secondary">返回列表</button>
          </router-link>
        </div>

        <div style="margin-bottom:20px;">
          <h4 style="margin-bottom:8px;color:#666;">神秘标签</h4>
          <div>
            <span v-for="tag in item.mysteryTags" :key="tag" class="tag" style="font-size:14px;padding:6px 14px;">
              {{ tag }}
            </span>
          </div>
        </div>

        <div v-if="item.revealInfo && item.description" style="margin-bottom:20px;">
          <h4 style="margin-bottom:8px;color:#666;">详细描述</h4>
          <p style="color:#444;line-height:1.6;">{{ item.description }}</p>
        </div>

        <div v-if="item.revealInfo && item.ownerName" style="margin-bottom:20px;">
          <h4 style="margin-bottom:8px;color:#666;">发布者</h4>
          <p style="color:#444;">{{ item.ownerName }}</p>
        </div>

        <div v-if="item.revealInfo && item.contact" style="margin-bottom:20px;">
          <h4 style="margin-bottom:8px;color:#666;">联系方式</h4>
          <p style="color:#444;font-size:16px;font-weight:500;">{{ item.contact }}</p>
        </div>

        <div v-if="item.exchange && item.exchange.otherItem" class="card"
             style="background:#f5f7fa;margin-bottom:20px;">
          <h4 style="margin-bottom:12px;">交换信息</h4>
          <div style="display:flex;gap:16px;align-items:center;">
            <img :src="appendAuth(item.exchange.otherItem.image)"
                 style="width:80px;height:80px;object-fit:cover;border-radius:8px;"/>
            <div style="flex:1;">
              <p style="font-weight:500;margin-bottom:4px;">{{ item.exchange.otherItem.realName }}</p>
              <p style="color:#666;font-size:13px;margin-bottom:4px;">
                发布者：{{ item.exchange.otherItem.ownerName }}
              </p>
              <p v-if="item.exchange.contact" style="color:#667eea;font-weight:500;">
                对方联系方式：{{ item.exchange.contact }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="!isOwner && !item.revealInfo" class="card" style="background:linear-gradient(135deg,#fef9f0,#fff0f5);margin-bottom:20px;border:1px solid #f0d0a0;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span style="font-size:22px;">🔮</span>
            <h4 style="margin:0;color:#d4544a;">猜猜盒里是什么</h4>
          </div>
          <p style="color:#888;font-size:13px;margin-bottom:12px;">
            根据神秘标签和模糊图片，猜猜这个盲盒里到底是什么？每人只能猜一次哦！
          </p>

          <div v-if="guessData.myGuess" style="background:white;border-radius:10px;padding:12px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="font-size:14px;">✅</span>
              <span style="color:#666;font-size:13px;">你已提交猜测：</span>
            </div>
            <p style="color:#d4544a;font-weight:600;font-size:16px;margin:0;">{{ guessData.myGuess.content }}</p>
          </div>

          <div v-else>
            <div style="display:flex;gap:8px;">
              <input
                v-model="guessContent"
                placeholder="输入你的猜测..."
                style="flex:1;"
                @keyup.enter="handleSubmitGuess"
              />
              <button
                class="btn btn-primary"
                :disabled="!guessContent.trim() || submittingGuess"
                @click="handleSubmitGuess"
                style="white-space:nowrap;"
              >
                {{ submittingGuess ? '提交中...' : '提交猜测' }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="guessData.totalGuesses > 0" class="card" style="background:#f8f9ff;margin-bottom:20px;border:1px solid #dde;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:18px;">📊</span>
              <h4 style="margin:0;">猜测分布</h4>
            </div>
            <span style="color:#999;font-size:13px;">共 {{ guessData.totalGuesses }} 人参与</span>
          </div>

          <div v-for="(entry, index) in guessData.distribution" :key="entry.content"
               style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-weight:500;font-size:14px;">
                {{ index + 1 }}. {{ entry.content }}
                <span v-if="guessData.myGuess && entry.content === guessData.myGuess.content"
                      style="color:#667eea;font-size:12px;margin-left:4px;">（我的猜测）</span>
              </span>
              <span style="color:#999;font-size:13px;">{{ entry.count }} 票</span>
            </div>
            <div style="background:#e8ecf3;border-radius:4px;height:8px;overflow:hidden;">
              <div :style="guessBarStyle(entry.count, guessData.totalGuesses)"></div>
            </div>
            <div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px;">
              <span v-for="g in entry.guessers" :key="g.userName"
                    :style="g.isMe
                      ? 'background:#667eea;color:white;font-size:11px;padding:2px 8px;border-radius:10px;'
                      : 'background:#f0f0f0;color:#666;font-size:11px;padding:2px 8px;border-radius:10px;'">
                {{ g.isMe ? '我' : g.userName }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="item.revealInfo && guessData.myGuess" class="card"
             style="background:linear-gradient(135deg,#e8f5e9,#f1f8e9);margin-bottom:20px;border:1px solid #a5d6a7;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span style="font-size:22px;">🎉</span>
            <h4 style="margin:0;color:#2e7d32;">答案揭晓</h4>
          </div>
          <div style="display:flex;gap:20px;align-items:stretch;">
            <div style="flex:1;background:white;border-radius:10px;padding:14px;text-align:center;border:2px solid #667eea;">
              <div style="color:#667eea;font-size:12px;margin-bottom:6px;">我的猜测</div>
              <div style="font-weight:600;font-size:16px;color:#333;">{{ guessData.myGuess.content }}</div>
            </div>
            <div style="display:flex;align-items:center;font-size:20px;color:#aaa;">VS</div>
            <div style="flex:1;background:white;border-radius:10px;padding:14px;text-align:center;border:2px solid #4caf50;">
              <div style="color:#4caf50;font-size:12px;margin-bottom:6px;">真实答案</div>
              <div style="font-weight:600;font-size:16px;color:#333;">{{ item.realName }}</div>
            </div>
          </div>
          <div v-if="isGuessCorrect" style="margin-top:12px;text-align:center;">
            <span style="background:#4caf50;color:white;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:500;">
              🎯 猜对了！太厉害了！
            </span>
          </div>
          <div v-else style="margin-top:12px;text-align:center;">
            <span style="background:#ff9800;color:white;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:500;">
              🤔 差一点点，下次加油！
            </span>
          </div>
        </div>

        <div v-if="isOwner && item.revealInfo && guessData.totalGuesses > 0" class="card"
             style="background:linear-gradient(135deg,#e3f2fd,#e8eaf6);margin-bottom:20px;border:1px solid #90caf9;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span style="font-size:22px;">👁️</span>
            <h4 style="margin:0;color:#1565c0;">大家猜了什么</h4>
          </div>
          <div style="background:white;border-radius:10px;padding:14px;margin-bottom:12px;text-align:center;border:2px solid #1565c0;">
            <div style="color:#1565c0;font-size:12px;margin-bottom:6px;">真实答案</div>
            <div style="font-weight:600;font-size:18px;color:#333;">{{ item.realName }}</div>
          </div>
          <p style="color:#666;font-size:13px;margin-bottom:10px;">猜测命中情况：</p>
          <div v-for="entry in guessData.distribution" :key="'owner-' + entry.content"
               style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span v-if="isEntryCorrect(entry.content)" style="font-size:14px;">✅</span>
            <span v-else style="font-size:14px;">❌</span>
            <span style="font-weight:500;font-size:14px;flex:1;">{{ entry.content }}</span>
            <span style="color:#999;font-size:13px;">{{ entry.count }} 人</span>
          </div>
        </div>

        <div v-if="item.status === 'available' && !isOwner">
          <div style="background:#eef2ff;padding:16px;border-radius:12px;margin-bottom:16px;">
            <h4 style="margin-bottom:12px;">选择你的物品进行交换</h4>
            <div v-if="myItemsLoading" style="color:#666;">加载中...</div>
            <div v-else-if="availableItems.length === 0" style="color:#666;">
              你没有可交换的物品，
              <router-link to="/publish" style="color:#667eea;text-decoration:underline;">去发布一个</router-link>
            </div>
            <select v-else v-model="selectedMyItemId" style="margin-bottom:12px;">
              <option value="">请选择一个物品</option>
              <option v-for="it in availableItems" :key="it.id" :value="it.id">
                {{ it.realName }} ({{ it.mysteryTags.join(', ') }})
              </option>
            </select>
          </div>
          <button
            class="btn btn-primary"
            style="width:100%;padding:16px;font-size:16px;"
            :disabled="!selectedMyItemId || exchanging"
            @click="handleExchange"
          >
            {{ exchanging ? '交换申请中...' : '确认交换' }}
          </button>
          <p style="color:#999;font-size:12px;text-align:center;margin-top:8px;">
            确认交换后，双方的真实信息和联系方式将互相公开
          </p>
        </div>

        <div v-if="isOwner && item.status === 'available'" style="padding:16px;background:#fff8e1;border-radius:12px;text-align:center;">
          <p style="color:#b8860b;">这是你发布的物品，等待其他用户来交换吧！</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getItemDetail, getMyItems, createExchange, appendAuth, submitGuess, getGuessDistribution } from '../api/index.js'
import { userStore } from '../store/user.js'

const route = useRoute()

const item = ref(null)
const loading = ref(true)
const myItems = ref([])
const myItemsLoading = ref(true)
const selectedMyItemId = ref('')
const exchanging = ref(false)

const guessContent = ref('')
const submittingGuess = ref(false)
const guessData = ref({
  totalGuesses: 0,
  distribution: [],
  myGuess: null
})

const categories = {
  book: '书籍类',
  figure: '手办类',
  toy: '玩具类',
  game: '游戏类',
  digital: '数码类',
  other: '其他'
}

const isOwner = computed(function() {
  return item.value && item.value.ownerId === userStore.user.id
})

const isGuessCorrect = computed(function() {
  if (!guessData.value.myGuess || !item.value || !item.value.realName) return false
  return guessData.value.myGuess.content.trim().toLowerCase() === item.value.realName.trim().toLowerCase()
})

const availableItems = computed(function() {
  return myItems.value.filter(function(i) { return i.status === 'available' })
})

function getCategoryName(key) {
  return categories[key] || key
}

function guessBarStyle(count, total) {
  var percent = total > 0 ? (count / total * 100) : 0
  return {
    height: '100%',
    borderRadius: '4px',
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
    width: Math.max(percent, 3) + '%',
    transition: 'width 0.5s ease'
  }
}

function isEntryCorrect(content) {
  if (!item.value || !item.value.realName) return false
  return content.trim().toLowerCase() === item.value.realName.trim().toLowerCase()
}

async function loadItem() {
  loading.value = true
  try {
    item.value = await getItemDetail(route.params.id, userStore.user.id)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadMyItems() {
  myItemsLoading.value = true
  try {
    myItems.value = await getMyItems(userStore.user.id)
  } catch (e) {
    console.error(e)
  } finally {
    myItemsLoading.value = false
  }
}

async function loadGuessData() {
  try {
    guessData.value = await getGuessDistribution(route.params.id, userStore.user.id)
  } catch (e) {
    console.error(e)
  }
}

async function handleSubmitGuess() {
  if (!guessContent.value.trim()) return
  submittingGuess.value = true
  try {
    await submitGuess(route.params.id, userStore.user.id, userStore.user.name, guessContent.value.trim())
    guessContent.value = ''
    await loadGuessData()
  } catch (e) {
    alert('提交失败：' + (e.response && e.response.data ? e.response.data.error : e.message))
  } finally {
    submittingGuess.value = false
  }
}

async function handleExchange() {
  if (!confirm('确定要交换吗？交换后双方的真实信息将互相公开。')) {
    return
  }
  exchanging.value = true
  try {
    await createExchange(selectedMyItemId.value, route.params.id)
    alert('交换成功！双方的真实信息已互相公开，请通过联系方式联系对方完成交换。')
    loadItem()
    loadGuessData()
  } catch (e) {
    alert('交换失败：' + (e.response && e.response.data ? e.response.data.error : e.message))
  } finally {
    exchanging.value = false
  }
}

onMounted(function() {
  loadItem()
  loadMyItems()
  loadGuessData()
})
</script>
