import { createRouter, createWebHistory } from 'vue-router'
import ChannelsView from '../views/ChannelsView.vue'
import ChannelView from '../views/ChannelView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import PostView from '../views/PostView.vue'
import AboutUsView from '../views/AboutUsView.vue'
import HelpView from '../views/HelpView.vue'

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
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
    {
      path: '/about-us',
      name: 'about-us',
      component: AboutUsView,
    },
    {
      path: '/help',
      name: 'help',
      component: HelpView,
    }
  ],
})

export default router
