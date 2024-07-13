/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import ChatsController from '#controllers/chats_controller'
import router from '@adonisjs/core/services/router'

router.post('/ask', [ChatsController, 'askQuestion'])
router.post('/addSource', [ChatsController, 'store'])
