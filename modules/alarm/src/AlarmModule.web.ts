import { registerWebModule, NativeModule } from 'expo';

class AlarmModule extends NativeModule<{}> {}

export default registerWebModule(AlarmModule, 'AlarmModule');
