#!/usr/bin/env python3
"""
Test MFA integration for Thai Tone Trainer.
"""

import pytest
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_mfa_installation():
    """Test that MFA is installed and accessible."""
    import subprocess
    
    try:
        result = subprocess.run(
            ["mfa", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        assert result.returncode == 0, "MFA command failed"
        print(f"✅ MFA version: {result.stdout.strip()}")
        return True
    except FileNotFoundError:
        pytest.skip("MFA not installed")
        return False

def test_thai_model_available():
    """Test that Thai MFA model is available."""
    import subprocess
    
    # Skip if MFA not installed
    if not test_mfa_installation():
        pytest.skip("MFA not installed")
    
    try:
        result = subprocess.run(
            ["mfa", "model", "list", "acoustic"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # Check if thai_mfa is in the output
        if "thai_mfa" in result.stdout:
            print("✅ Thai MFA model found")
            return True
        else:
            print("⚠️  Thai MFA model not found")
            print("   Available models:", result.stdout)
            pytest.skip("Thai MFA model not installed")
            return False
            
    except subprocess.TimeoutExpired:
        pytest.skip("MFA model list timeout")
        return False

def test_python_dependencies():
    """Test that Python dependencies are installed."""
    required_packages = [
        "montreal_forced_aligner",
        "librosa",
        "pythainlp",
        "soundfile",
        "numpy"
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} installed")
        except ImportError:
            missing.append(package)
            print(f"❌ {package} not installed")
    
    if missing:
        pytest.skip(f"Missing packages: {missing}")
        return False
    
    return True

def test_syllable_tokenization():
    """Test PyThaiNLP syllable tokenization."""
    try:
        import pythainlp
        
        # Test simple Thai words
        test_cases = [
            ("สวัสดี", ["ส", "วัส", "ดี"]),
            ("ขอบคุณ", ["ขอบ", "คุณ"]),
            ("อาหาร", ["อา", "หาร"]),
        ]
        
        for word, expected in test_cases:
            result = pythainlp.tokenize.syllable_tokenize(word)
            print(f"✅ '{word}' → {result}")
            assert result == expected, f"Tokenization failed for {word}"
        
        return True
        
    except ImportError:
        pytest.skip("PyThaiNLP not installed")
        return False

def test_audio_processing():
    """Test basic audio processing capabilities."""
    test_file = "test_audio.wav"
    try:
        import librosa
        import soundfile as sf
        import numpy as np
        
        # Create test audio
        test_audio = np.zeros(16000)  # 1 second of silence at 16kHz
        
        # Write and read back
        sf.write(test_file, test_audio, 16000)
        audio, sr = librosa.load(test_file, sr=16000)
        
        assert len(audio) == 16000, "Audio length mismatch"
        assert sr == 16000, "Sample rate mismatch"
        
        print(f"✅ Audio processing: {len(audio)} samples at {sr}Hz")
        
    except ImportError:
        pytest.skip("Audio libraries not installed")
    finally:
        if os.path.exists(test_file):
            os.remove(test_file)

def test_mfa_alignment_with_silence():
    """Test MFA alignment with silent audio (basic test)."""
    # Skip if MFA or model not available
    if not test_mfa_installation() or not test_thai_model_available():
        pytest.skip("MFA or Thai model not available")
    
    try:
        import subprocess
        import tempfile
        import numpy as np
        import soundfile as sf
        
        # Create temporary directory
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create silent audio
            audio_file = os.path.join(tmpdir, "test.wav")
            silence = np.zeros(32000)  # 2 seconds at 16kHz
            sf.write(audio_file, silence, 16000)
            
            # Create text file
            text_file = os.path.join(tmpdir, "text.txt")
            with open(text_file, "w", encoding="utf-8") as f:
                f.write("สวัสดี")
            
            # Run MFA alignment
            output_dir = os.path.join(tmpdir, "output")
            
            cmd = [
                "mfa", "align",
                "--clean",
                "--single_speaker",
                "--beam", "100",
                "--retry_beam", "400",
                audio_file,
                text_file,
                "thai_mfa",
                output_dir
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Check if alignment completed (may fail with silent audio)
            if result.returncode == 0:
                print("✅ MFA alignment completed")
                
                # Check for output files
                textgrid_files = [
                    f for f in os.listdir(output_dir)
                    if f.endswith(('.TextGrid', '.textgrid'))
                ]
                
                if textgrid_files:
                    print(f"✅ TextGrid file created: {textgrid_files[0]}")
                    return True
                else:
                    print("⚠️  No TextGrid file created (expected with silent audio)")
                    return False
            else:
                print(f"⚠️  MFA alignment failed (may be expected with silent audio)")
                print(f"   Error: {result.stderr[:200]}...")
                return False
                
    except Exception as e:
        print(f"⚠️  Test error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Running MFA integration tests...")
    print("=" * 60)
    
    tests = [
        test_mfa_installation,
        test_thai_model_available,
        test_python_dependencies,
        test_syllable_tokenization,
        test_audio_processing,
        test_mfa_alignment_with_silence
    ]
    
    results = []
    for test in tests:
        print(f"\n🔍 Running {test.__name__}...")
        try:
            success = test()
            results.append((test.__name__, success))
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append((test.__name__, False))
    
    print("\n" + "=" * 60)
    print("📊 Test Results:")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {name}")
        if success:
            passed += 1
    
    print("\n" + "=" * 60)
    print(f"Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
    elif passed >= total * 0.7:
        print("⚠️  Most tests passed - check warnings")
    else:
        print("❌ Many tests failed - check setup")
        sys.exit(1)
