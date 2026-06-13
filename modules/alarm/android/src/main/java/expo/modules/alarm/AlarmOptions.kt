package expo.modules.alarm

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class AlarmOptions : Record {
  @Field val id: String = ""
  @Field val itemId: String = ""
  @Field val itemTitle: String = ""
  @Field val itemProgress: Int = 0
  @Field val itemCurrent: Int = 0
  @Field val itemTotal: Int = 0
  @Field val itemUnit: String = ""
  @Field val hour: Int = 8
  @Field val minute: Int = 0
  @Field val days: List<Int> = emptyList()
}