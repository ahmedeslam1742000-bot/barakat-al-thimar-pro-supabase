<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\DB;

class SettingController extends Controller
{
    public function show()
    {
        $settings = DB::table('system_settings')->where('id', '00000000-0000-0000-0000-000000000001')->first();
        return response()->json($settings ? json_decode($settings->settings, true) : null);
    }

    public function update(Request $request)
    {
        $settings = $request->input('settings');
        DB::table('system_settings')->updateOrInsert(
            ['id' => '00000000-0000-0000-0000-000000000001'],
            ['settings' => is_string($settings) ? $settings : json_encode($settings), 'updated_at' => now()]
        );
        return response()->json(['message' => 'Settings updated']);
    }
}
