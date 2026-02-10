import { createRouter, createWebHistory } from 'vue-router'
import ChannelsView from '../views/ChannelsView.vue'
import ChannelView from '../views/ChannelView.vue'
import PostView from '../views/PostView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import RegisterView from '../views/RegisterView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/channels',
    },
    {
      path: '/channels',
      name: 'channels',
      component: ChannelsView,
    },
    {
      path: '/channels/:channelSlug',
      name: 'channel',
      component: ChannelView,
      props: true,
    },
    {
      path: '/channels/:channelSlug/posts/:postId',
      name: 'post',
      component: PostView,
      props: true,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
})

export default router
