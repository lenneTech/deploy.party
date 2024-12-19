import {Body, Controller, Delete, Get, Param, Post} from "@nestjs/common";
import {WebPushService} from "../web-push.service";
import {SubscribeWebPush} from "../inputs/subscribe-web-push";
import {CurrentUser, RoleEnum, Roles} from "@lenne.tech/nest-server";
import {User} from "../../user/user.model";
import {SendWebPush} from "../inputs/send-web-push";

@Controller('web-push')
export class WebPushController {
  constructor(private readonly webPushService: WebPushService) {}

  @Roles(RoleEnum.S_USER)
  @Post()
  send(@Body() input: SendWebPush, @CurrentUser() user: User) {
    return this.webPushService.send(input)
  }

  @Roles(RoleEnum.S_USER)
  @Post('/subscribe')
  subscribe(@Body() input: SubscribeWebPush, @CurrentUser() user: User) {
    return this.webPushService.subscribe(input, user)
  }

  @Roles(RoleEnum.S_USER)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.webPushService.get(id, {currentUser: user})
  }

  @Roles(RoleEnum.S_USER)
  @Delete()
  delete(@CurrentUser() user: User) {
    return this.webPushService.unsubscribe(user?.id, user)
  }
}
