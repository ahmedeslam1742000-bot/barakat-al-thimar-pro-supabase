<?php

namespace App\Http\Controllers;

use App\Models\Rep;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class RepController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Rep::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:reps,name',
            'phone' => 'nullable|string|max:255',
            'zone' => 'nullable|string|max:255',
        ]);

        $rep = \App\Models\Rep::create($validated);
        return response()->json($rep, 201);
    }

    public function update(Request $request, \App\Models\Rep $rep)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:reps,name,' . $rep->id,
            'phone' => 'nullable|string|max:255',
            'zone' => 'nullable|string|max:255',
        ]);

        $rep->update($validated);
        return response()->json($rep);
    }

    public function destroy(\App\Models\Rep $rep)
    {
        $rep->delete();
        return response()->json(['message' => 'deleted']);
    }
}
